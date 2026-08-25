'use client';

import Image from 'next/image';
import { type FormEvent, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAvailabilityCheck } from '@/hooks/useAvailabilityCheck';
import { useBeachHouses } from '@/hooks/useBeachHouses';
import { useBoats, useRentalBoats } from '@/hooks/useBoats';
import { useLocations } from '@/hooks/useLocations';
import { useExperienceLocations } from '@/hooks/useExperienceLocations';
import { useTransportRoutes } from '@/hooks/useTransportRoutes';
import {
  ArrowIcon,
  Button,
  Card,
  FormField,
  SelectInput,
  TabNavigation,
  TextArea,
  TextInput,
} from '@/components/ui';
import type { BeachHouse } from '@/services/apiBeachHouse';
import type {
  AvailabilityParams,
  BeachHouseBookingMode,
  BookingType,
  CreateBookingInput,
} from '@/services/apiBooking';
import { initializeBookingPayment } from '@/services/apiBooking';
import type { Boat } from '@/services/apiBoat';
import { findBoatRoutePrice } from '@/utils/transferPricing';
import {
  BEACH_HOUSE_WINDOWS,
  beachHousePriceBreakdown,
} from '@/utils/beachHousePricing';
import { formatBookingTime } from '@/utils/boatBookingHours';
import { calculateVatBreakdown } from '@/utils/vat';
import styles from './reservationPlanner.module.css';

type Experience = BookingType;
type Listing = Boat | BeachHouse;

const experienceLabels: Record<Experience, string> = {
  boat_cruise: 'Yacht cruises',
  beach_house: 'Waterfront stays',
  boat_rental: 'Boat transfers',
};

const experienceTabs = Object.entries(experienceLabels).map(
  ([value, label]) => ({
    label,
    value: value as Experience,
  }),
);

const { start: DAY_BOOKING_START, end: DAY_BOOKING_END } =
  BEACH_HOUSE_WINDOWS.day_use;
const { start: OVERNIGHT_BOOKING_START, end: OVERNIGHT_BOOKING_END } =
  BEACH_HOUSE_WINDOWS.overnight;

function addHours(time: string, duration: number) {
  const [hours, minutes] = time.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + duration * 60;
  const endingHours = Math.floor(totalMinutes / 60) % 24;
  const endingMinutes = totalMinutes % 60;

  return `${String(endingHours).padStart(2, '0')}:${String(endingMinutes).padStart(2, '0')}`;
}

function currency(amount: number | null | undefined) {
  return amount == null ? 'Price on request' : `NGN ${amount.toLocaleString()}`;
}

function nightsBetween(arrival: string, departure: string) {
  if (!arrival || !departure) return 0;
  const duration =
    new Date(`${departure}T00:00:00`).getTime() -
    new Date(`${arrival}T00:00:00`).getTime();

  return Math.max(0, Math.round(duration / (1000 * 60 * 60 * 24)));
}

function listingImage(listing: Listing) {
  return listing.images?.find((image) => image.id === listing.cover_image_id)
    ?.image_url ?? listing.images?.[0]?.image_url;
}

function listingImages(listing: Listing) {
  const images = listing.images ?? [];
  const cover = images.find((image) => image.id === listing.cover_image_id);
  const ordered = cover
    ? [cover, ...images.filter((image) => image.id !== cover.id)]
    : images;

  return ordered.map((image) => image.image_url).filter(Boolean);
}

function isBoat(listing: Listing): listing is Boat {
  return 'boat_type' in listing;
}

function whatsappBookingUrl(number: string, message: string) {
  const digits = number.replace(/\D/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

function ReservationPlanner() {
  const [experience, setExperience] = useState<Experience>('boat_cruise');
  const [location, setLocation] = useState('');
  const [assetId, setAssetId] = useState('');
  const [date, setDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('11:00');
  const [duration, setDuration] = useState(3);
  const [guests, setGuests] = useState(2);
  const [stayMode, setStayMode] =
    useState<BeachHouseBookingMode>('day_use');
  const [routeId, setRouteId] = useState('');
  const [pickupJettyId, setPickupJettyId] = useState('');
  const [isBeachHouseTransfer, setIsBeachHouseTransfer] = useState(false);
  const [beachHouseBookingReference, setBeachHouseBookingReference] =
    useState('');
  const [request, setRequest] = useState<AvailabilityParams | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [confirmationReference, setConfirmationReference] = useState('');
  const [submissionError, setSubmissionError] = useState('');
  const [isPaymentStarting, setIsPaymentStarting] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [imageIndexes, setImageIndexes] = useState<Record<string, number>>({});
  const [gallery, setGallery] = useState<{
    listing: Listing;
    index: number;
  } | null>(null);
  const reservationRef = useRef<HTMLElement>(null);

  const { boats, isLoading: boatsLoading, error: boatError } = useBoats();
  const {
    boats: rentalBoats,
    isLoading: rentalsLoading,
    error: rentalError,
  } = useRentalBoats();
  const {
    beachHouses,
    isLoading: housesLoading,
    error: houseError,
  } = useBeachHouses();
  const { locations } = useLocations();
  const { experienceLocations } = useExperienceLocations();
  const { routes, isLoading: routesLoading } = useTransportRoutes();

  const assets: Listing[] = useMemo(() => {
    if (experience === 'beach_house') return beachHouses;
    return experience === 'boat_rental' ? rentalBoats : boats;
  }, [beachHouses, boats, experience, rentalBoats]);

  // Boats are not tied to a jetty — they can operate from any of them — so
  // only beach houses are filtered by location here. Cruise customers choose
  // their pickup jetty on the booking form instead.
  const filteredAssets = assets.filter((asset) => {
    if (!location) return true;
    if (isBoat(asset)) return true;
    return asset.experience_location_id === location;
  });

  const filterLocations =
    experience === 'beach_house' ? experienceLocations : locations;
  const filterLabel =
    experience === 'beach_house'
      ? 'Experience location'
      : experience === 'boat_cruise'
        ? 'Pickup jetty'
        : 'Route jetty';
  const filteredRoutes = routes.filter((route) => {
    if (experience !== 'boat_rental') return true;
    const hasBoatPrice = route.boat_prices?.some(
      (price) => price.boat_id === assetId && price.is_active,
    );
    if (!hasBoatPrice) return false;
    if (!location) return true;
    return route.from_location_id === location;
  });

  const selectedAsset = assets.find((asset) => asset.id === assetId);
  const selectedBoat =
    selectedAsset && isBoat(selectedAsset) ? selectedAsset : undefined;
  const selectedHouse =
    selectedAsset && !isBoat(selectedAsset) ? selectedAsset : undefined;
  const selectedRoute = routes.find((route) => route.id === routeId);

  const isLoading =
    experience === 'boat_cruise'
      ? boatsLoading
      : experience === 'boat_rental'
        ? rentalsLoading
        : housesLoading;
  const assetError =
    experience === 'boat_cruise'
      ? boatError
      : experience === 'boat_rental'
        ? rentalError
        : houseError;

  const minimumDate = new Date().toISOString().slice(0, 10);
  const minimumDuration = selectedBoat?.min_booking_hours ?? 1;
  const maximumDuration = selectedBoat?.max_booking_hours ?? undefined;
  const durationUsed = Math.max(
    minimumDuration,
    Math.min(duration, maximumDuration ?? duration),
  );
  const oneWayTransferHours = selectedRoute?.duration_hours ?? 1;
  const endTime =
    experience === 'boat_rental'
      ? addHours(startTime, oneWayTransferHours)
      : experience === 'beach_house'
        ? stayMode === 'day_use'
          ? DAY_BOOKING_END
          : OVERNIGHT_BOOKING_END
      : addHours(startTime, durationUsed);
  const bookingEndDate = experience === 'beach_house' ? endDate : date;
  const stayNights = nightsBetween(date, endDate);
  const extraGuestCount =
    experience === 'beach_house' && selectedHouse?.max_guests != null
      ? Math.max(0, guests - selectedHouse.max_guests)
      : 0;
  const extraGuestCharge =
    extraGuestCount * (selectedHouse?.extra_guest_fee_per_head ?? 0);
  const housePriceBreakdown =
    experience === 'beach_house'
      ? beachHousePriceBreakdown(
          stayMode,
          {
            dayRate: selectedHouse?.day_rate ?? null,
            overnightRate: selectedHouse?.overnight_rate ?? null,
          },
          stayMode === 'overnight' ? stayNights : 1,
        )
      : null;

  const estimatedSubtotal = (() => {
    if (experience === 'boat_cruise') {
      return selectedBoat?.price_per_hour
        ? selectedBoat.price_per_hour * durationUsed
        : null;
    }

    if (experience === 'boat_rental') {
      return findBoatRoutePrice(selectedRoute, selectedBoat?.id ?? '');
    }

    return housePriceBreakdown == null
      ? null
      : housePriceBreakdown.subtotal + extraGuestCharge;
  })();
  const vatBreakdown =
    estimatedSubtotal == null
      ? null
      : calculateVatBreakdown(estimatedSubtotal);
  const estimatedTotal = vatBreakdown?.totalAmount ?? null;

  const availability = useAvailabilityCheck(request);

  function resetOutcome() {
    setRequest(null);
    setConfirmationReference('');
    setSubmissionError('');
    closeBookingModal();
  }

  function resetCustomerForm() {
    setCustomerName('');
    setCustomerEmail('');
    setCustomerPhone('');
    setNotes('');
    setSubmissionError('');
    setIsPaymentStarting(false);
  }

  function closeBookingModal() {
    setIsBookingModalOpen(false);
    resetCustomerForm();
  }

  function switchExperience(nextExperience: Experience) {
    setExperience(nextExperience);
    setAssetId('');
    setLocation('');
    setRouteId('');
    setIsBeachHouseTransfer(false);
    setBeachHouseBookingReference('');
    resetOutcome();
  }

  function selectStayMode(value: BeachHouseBookingMode) {
    setStayMode(value);
    setStartTime(
      value === 'day_use' ? DAY_BOOKING_START : OVERNIGHT_BOOKING_START,
    );
    resetOutcome();
  }

  function selectListing(listing: Listing) {
    if (listing.id === assetId) {
      setAssetId('');
      setRouteId('');
      resetOutcome();
      return;
    }

    setAssetId(listing.id);
    setGuests(Math.min(guests, listing.max_guests ?? guests));
    if (isBoat(listing)) {
      setDuration(listing.min_booking_hours ?? 1);
    } else {
      setStartTime(
        stayMode === 'day_use' ? DAY_BOOKING_START : OVERNIGHT_BOOKING_START,
      );
    }
    resetOutcome();
    window.setTimeout(() => {
      reservationRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 0);
  }

  function setListingImage(listing: Listing, nextIndex: number) {
    const images = listingImages(listing);
    if (images.length === 0) return;

    const normalizedIndex = (nextIndex + images.length) % images.length;
    setImageIndexes((current) => ({
      ...current,
      [listing.id]: normalizedIndex,
    }));
  }

  function openGallery(listing: Listing, index: number) {
    setGallery({ listing, index });
  }

  function setGalleryImage(nextIndex: number) {
    setGallery((current) => {
      if (!current) return null;
      const images = listingImages(current.listing);
      if (images.length === 0) return current;

      return {
        ...current,
        index: (nextIndex + images.length) % images.length,
      };
    });
  }

  function buildAvailabilityRequest() {
    if (!selectedAsset || !date) return null;

    if (experience === 'beach_house' && stayMode === 'overnight') {
      if (!endDate || stayNights < 1) return null;
      return {
        resourceType: 'beach_house' as const,
        resourceId: selectedAsset.id,
        startDate: date,
        endDate,
        startTime: OVERNIGHT_BOOKING_START,
        endTime: OVERNIGHT_BOOKING_END,
      };
    }

    if (experience === 'boat_cruise' && !pickupJettyId) return null;

    if (experience === 'boat_rental') {
      if (!selectedRoute) return null;
      if (isBeachHouseTransfer && !beachHouseBookingReference.trim()) {
        return null;
      }
    }

    return {
      resourceType: experience === 'beach_house' ? 'beach_house' : 'boat',
      resourceId: selectedAsset.id,
      startDate: date,
      endDate: date,
      startTime:
        experience === 'beach_house' ? DAY_BOOKING_START : startTime,
      endTime,
    } satisfies AvailabilityParams;
  }

  function handleAvailability(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextRequest = buildAvailabilityRequest();
    setSubmissionError('');
    setConfirmationReference('');
    closeBookingModal();
    if (nextRequest) setRequest(nextRequest);
  }

  function bookingPayload(): CreateBookingInput | null {
    const availabilityRequest = buildAvailabilityRequest();
    if (!availabilityRequest || !selectedAsset || estimatedTotal == null) {
      return null;
    }

    return {
      booking_type: experience,
      boat_id: experience === 'beach_house' ? null : selectedAsset.id,
      beach_house_id:
        experience === 'beach_house' ? selectedAsset.id : null,
      beach_house_booking_mode:
        experience === 'beach_house' ? stayMode : null,
      customer_name: customerName.trim(),
      customer_email: customerEmail.trim(),
      customer_phone: customerPhone.trim(),
      guest_count: guests,
      start_date: availabilityRequest.startDate,
      end_date: availabilityRequest.endDate,
      start_time: availabilityRequest.startTime,
      end_time: availabilityRequest.endTime,
      hours:
        experience === 'beach_house' && stayMode === 'overnight'
          ? null
          : experience === 'boat_rental' || experience === 'beach_house'
            ? null
            : durationUsed,
      rental_type: experience === 'boat_rental' ? 'outbound' : null,
      rental_route_id: experience === 'boat_rental' ? routeId : null,
      parent_beach_house_booking_reference:
        experience === 'boat_rental' && isBeachHouseTransfer
          ? beachHouseBookingReference.trim()
          : null,
      pickup_location_id:
        experience === 'boat_cruise' ? pickupJettyId || null : null,
      pickup_location:
        experience === 'boat_rental'
          ? selectedRoute?.from_location?.name
          : experience === 'boat_cruise'
            ? locations.find((place) => place.id === pickupJettyId)?.name
            : null,
      dropoff_location:
        experience === 'boat_rental' ? selectedRoute?.to_location?.name : null,
      total_amount: estimatedTotal,
      notes: notes.trim() || null,
    };
  }

  async function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = bookingPayload();
    if (!payload) return;
    if (
      experience === 'boat_rental' &&
      isBeachHouseTransfer &&
      !beachHouseBookingReference.trim()
    ) {
      setSubmissionError('Please provide the waterfront stay booking number.');
      return;
    }

    setSubmissionError('');
    setIsPaymentStarting(true);
    try {
      const payment = await initializeBookingPayment(payload);
      window.location.assign(payment.authorizationUrl);
    } catch (error) {
      setIsPaymentStarting(false);
      setSubmissionError(
        error instanceof Error
          ? error.message
          : 'Your request could not be submitted.',
      );
    }
  }

  return (
    <section className={styles.section} id="plan-charter">
      <div className={`wrap ${styles.searchBar}`}>
        <div>
          <p className={styles.eyebrow}>Book Your Escape</p>
          <h2>Find an available experience</h2>
        </div>
        {experience !== 'boat_cruise' && (
          <FormField label={filterLabel}>
            <SelectInput
              value={location}
              onChange={(event) => {
                setLocation(event.target.value);
                setAssetId('');
                setRouteId('');
                resetOutcome();
              }}
            >
              <option value="">
                {experience === 'beach_house'
                  ? 'All waterfront destinations'
                  : 'All transfer jetties'}
              </option>
              {filterLocations.map((place) => (
                <option
                  key={place.id}
                  value={place.id}
                >
                  {place.name}
                </option>
              ))}
            </SelectInput>
          </FormField>
        )}
      </div>

      <div className="wrap" id="listings">
        <TabNavigation
          ariaLabel="Experience type"
          onChange={switchExperience}
          tabs={experienceTabs}
          value={experience}
        />

        <div className={styles.marketplace}>
          <div className={styles.catalog}>
            <div className={styles.resultsHeader}>
              <h2>{experienceLabels[experience]}</h2>
              <p>
                {isLoading
                  ? 'Loading collection...'
                  : `${filteredAssets.length} available option${filteredAssets.length === 1 ? '' : 's'}`}
              </p>
            </div>

            {assetError && (
              <p className={styles.empty}>
                The collection could not be loaded right now.
              </p>
            )}
            {!isLoading && !assetError && filteredAssets.length === 0 && (
              <p className={styles.empty}>
                No listings match that location. Try all Lagos destinations.
              </p>
            )}

            <div className={styles.listings}>
              {filteredAssets.map((listing) => {
                const images = listingImages(listing);
                const fallbackImage =
                  listingImage(listing) ?? '/images/charter-hero.png';
                const currentImageIndex = imageIndexes[listing.id] ?? 0;
                const galleryImages = images.length > 0 ? images : [fallbackImage];
                const boat = isBoat(listing);
                const rate =
                  experience === 'boat_rental'
                    ? 'Route pricing shown after selection'
                    : boat
                      ? `${currency(listing.price_per_hour)} / hour`
                      : null;

                return (
                  <Card
                    className={styles.listing}
                    glow
                    key={listing.id}
                    selected={listing.id === assetId}
                  >
                    <div className={styles.photo}>
                      <div
                        className={styles.imageTrack}
                        style={{
                          transform: `translate3d(-${currentImageIndex * 100}%, 0, 0)`,
                        }}
                      >
                        {galleryImages.map((imageUrl, index) => (
                          <div className={styles.imageSlide} key={`${imageUrl}-${index}`}>
                            <Image
                              alt={index === currentImageIndex ? listing.name : ''}
                              fill
                              sizes="(max-width: 880px) 100vw, 36vw"
                              src={imageUrl}
                            />
                          </div>
                        ))}
                      </div>
                      <Button
                        aria-label={`Expand ${listing.name} gallery`}
                        className={styles.expandGallery}
                        onClick={() => openGallery(listing, currentImageIndex)}
                        size="sm"
                        type="button"
                        variant="ghost"
                      >
                        Expand
                      </Button>
                      {images.length > 1 && (
                        <>
                          <Button
                            aria-label="Previous image"
                            className={`${styles.imageControl} ${styles.previousImage}`}
                            onClick={() =>
                              setListingImage(listing, currentImageIndex - 1)
                            }
                            type="button"
                            variant="icon"
                          >
                            <ArrowIcon direction="previous" />
                          </Button>
                          <Button
                            aria-label="Next image"
                            className={`${styles.imageControl} ${styles.nextImage}`}
                            onClick={() =>
                              setListingImage(listing, currentImageIndex + 1)
                            }
                            type="button"
                            variant="icon"
                          >
                            <ArrowIcon direction="next" />
                          </Button>
                          <div
                            aria-label={`${currentImageIndex + 1} of ${images.length} images`}
                            className={styles.imageCount}
                          >
                            {currentImageIndex + 1}/{images.length}
                          </div>
                        </>
                      )}
                    </div>
                    <div className={styles.listingBody}>
                      <div className={styles.listingTop}>
                        <p>
                          {boat ? listing.boat_type : 'Private residence'} |{' '}
                          {boat
                            ? listing.jetty_location?.name || listing.pickup_location || listing.location
                            : listing.experience_location?.name || listing.location}
                        </p>
                        <h3>{listing.name}</h3>
                      </div>
                      <p className={styles.summary}>{listing.description}</p>
                      <div className={styles.features}>
                        <span>Up to {listing.max_guests ?? '-'} guests</span>
                        {boat ? (
                          <span>{listing.cabins ?? '-'} cabins</span>
                        ) : (
                          <span>{listing.bedrooms ?? '-'} bedrooms</span>
                        )}
                      </div>
                      <div className={styles.rate}>
                        {boat ? (
                          <strong>{rate}</strong>
                        ) : (
                          <div className={styles.houseRateList}>
                            <span>
                              <small>Day stay</small>
                              <strong>{currency(listing.day_rate)}</strong>
                            </span>
                            <span>
                              <small>Overnight</small>
                              <strong>{currency(listing.overnight_rate)}</strong>
                            </span>
                          </div>
                        )}
                        <Button
                          onClick={() => selectListing(listing)}
                          type="button"
                        >
                          {listing.id === assetId ? 'Selected' : 'Reserve'}
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          <aside className={styles.reservation} ref={reservationRef}>
            {!selectedAsset ? (
              <div className={styles.prompt}>
                <p>Select an experience</p>
                <h2>Choose a listing to view dates and pricing.</h2>
                <span>
                  Every result is loaded from the current Gladiator collection.
                </span>
              </div>
            ) : (
              <>
                <div className={styles.selection}>
                  <p>
                    {experience === 'beach_house'
                      ? 'Waterfront stay'
                      : experience === 'boat_rental'
                        ? 'Private transfer'
                        : 'Yacht cruise'}
                  </p>
                  <h2>{selectedAsset.name}</h2>
                  <span>
                    Up to {selectedAsset.max_guests ?? '-'} guests
                    {' | '}
                    {isBoat(selectedAsset)
                      ? selectedAsset.boat_type || 'Private vessel'
                      : selectedAsset.experience_location?.name || selectedAsset.location}
                  </span>
                </div>

                <form className={styles.schedule} onSubmit={handleAvailability}>
                  {experience === 'boat_cruise' && (
                    <FormField className={styles.full} label="Pickup jetty">
                      <SelectInput
                        onChange={(event) => {
                          setPickupJettyId(event.target.value);
                          resetOutcome();
                        }}
                        required
                        value={pickupJettyId}
                      >
                        <option value="">Select a pickup jetty…</option>
                        {locations.map((place) => (
                          <option key={place.id} value={place.id}>
                            {place.name}
                          </option>
                        ))}
                      </SelectInput>
                    </FormField>
                  )}

                  {experience === 'beach_house' && (
                    <div className={`${styles.full} ${styles.stayTypeGroup}`}>
                      <p className={styles.controlLabel}>Choose your stay</p>
                      <div
                        aria-label="Stay type"
                        className={styles.stayTypeOptions}
                        role="group"
                      >
                        <button
                          aria-pressed={stayMode === 'day_use'}
                          className={
                            stayMode === 'day_use' ? styles.stayTypeActive : ''
                          }
                          onClick={() => selectStayMode('day_use')}
                          type="button"
                        >
                          <span>Day stay</span>
                          <small>12:00 PM–8:00 PM</small>
                        </button>
                        <button
                          aria-pressed={stayMode === 'overnight'}
                          className={
                            stayMode === 'overnight'
                              ? styles.stayTypeActive
                              : ''
                          }
                          onClick={() => selectStayMode('overnight')}
                          type="button"
                        >
                          <span>Overnight stay</span>
                          <small>8:00 PM–9:00 AM</small>
                        </button>
                      </div>
                    </div>
                  )}

                  {experience === 'boat_rental' && (
                    <>
                      <FormField className={styles.full} label="Route">
                        <SelectInput
                          value={routeId}
                          onChange={(event) => {
                            setRouteId(event.target.value);
                            resetOutcome();
                          }}
                          required
                        >
                          <option value="">
                            {routesLoading ? 'Loading routes...' : 'Select route'}
                          </option>
                          {filteredRoutes.map((route) => (
                            <option key={route.id} value={route.id}>
                              {route.from_location?.name} to{' '}
                              {route.to_location?.name}
                            </option>
                          ))}
                        </SelectInput>
                      </FormField>
                      <div className={styles.full}>
                        <label className={styles.checkboxField}>
                          <input
                            checked={isBeachHouseTransfer}
                            onChange={(event) => {
                              setIsBeachHouseTransfer(event.target.checked);
                              if (!event.target.checked) {
                                setBeachHouseBookingReference('');
                              }
                              resetOutcome();
                            }}
                            type="checkbox"
                          />
                          <span>
                            This transfer is for a booked waterfront stay
                          </span>
                        </label>
                        {isBeachHouseTransfer && (
                          <>
                            <FormField label="Waterfront stay booking number">
                              <TextInput
                                autoCapitalize="characters"
                                onChange={(event) => {
                                  setBeachHouseBookingReference(
                                    event.target.value,
                                  );
                                  resetOutcome();
                                }}
                                placeholder="e.g. GLD-123456"
                                required
                                type="text"
                                value={beachHouseBookingReference}
                              />
                            </FormField>
                            <p className={styles.fieldHint}>
                              We will verify the stay reference and link both
                              bookings before confirming the transfer.
                            </p>
                          </>
                        )}
                      </div>
                    </>
                  )}

                  <FormField
                    label={
                      experience === 'beach_house' && stayMode === 'overnight'
                        ? 'Check in'
                        : 'Date'
                    }
                  >
                    <TextInput
                      min={minimumDate}
                      onChange={(event) => {
                        setDate(event.target.value);
                        resetOutcome();
                      }}
                      required
                      type="date"
                      value={date}
                    />
                  </FormField>

                  {experience === 'beach_house' &&
                  stayMode === 'overnight' ? (
                    <FormField label="Check out">
                      <TextInput
                        min={date || minimumDate}
                        onChange={(event) => {
                          setEndDate(event.target.value);
                          resetOutcome();
                        }}
                        required
                        type="date"
                        value={endDate}
                      />
                    </FormField>
                  ) : experience === 'beach_house' ? null : (
                    <FormField label="Start time">
                      <TextInput
                        onChange={(event) => {
                          setStartTime(event.target.value);
                          resetOutcome();
                        }}
                        required
                        type="time"
                        value={startTime}
                      />
                      </FormField>
                    )}

                  <FormField
                    className={
                      experience === 'beach_house' && stayMode === 'overnight'
                        ? styles.full
                        : undefined
                    }
                    label="Total guests"
                  >
                    <TextInput
                      max={
                        experience === 'beach_house'
                          ? undefined
                          : selectedAsset.max_guests ?? undefined
                      }
                      min={1}
                      onChange={(event) => {
                        setGuests(Number(event.target.value));
                        resetOutcome();
                      }}
                      required
                      type="number"
                      value={guests}
                    />
                  </FormField>

                  {experience === 'boat_cruise' && (
                      <FormField label="Hours">
                        <TextInput
                          max={maximumDuration}
                          min={minimumDuration}
                          onChange={(event) => {
                            setDuration(Number(event.target.value));
                            resetOutcome();
                          }}
                          required
                          type="number"
                          value={duration}
                        />
                      </FormField>
                    )}

                  {experience === 'beach_house' ? (
                    <div className={`${styles.full} ${styles.priceSummary}`}>
                      <div className={styles.priceSummaryHeader}>
                        <span>Total payable</span>
                        <strong>{currency(estimatedTotal)}</strong>
                      </div>
                      {housePriceBreakdown && selectedHouse && (
                        <div className={styles.priceLines}>
                          {housePriceBreakdown.overnightBlocks > 0 && (
                            <div>
                              <span>
                                {housePriceBreakdown.overnightBlocks} overnight{' '}
                                block
                                {housePriceBreakdown.overnightBlocks === 1
                                  ? ''
                                  : 's'}
                              </span>
                              <strong>
                                {currency(
                                  housePriceBreakdown.overnightBlocks *
                                    (selectedHouse.overnight_rate ?? 0),
                                )}
                              </strong>
                            </div>
                          )}
                          {housePriceBreakdown.dayBlocks > 0 && (
                            <div>
                              <span>
                                {housePriceBreakdown.dayBlocks} daytime block
                                {housePriceBreakdown.dayBlocks === 1 ? '' : 's'}
                              </span>
                              <strong>
                                {currency(
                                  housePriceBreakdown.dayBlocks *
                                    (selectedHouse.day_rate ?? 0),
                                )}
                              </strong>
                            </div>
                          )}
                          {extraGuestCharge > 0 && (
                            <div>
                              <span>
                                {extraGuestCount} extra guest
                                {extraGuestCount === 1 ? '' : 's'}
                              </span>
                              <strong>{currency(extraGuestCharge)}</strong>
                            </div>
                          )}
                          {vatBreakdown && (
                            <>
                              <div className={styles.subtotalLine}>
                                <span>Subtotal</span>
                                <strong>{currency(vatBreakdown.subtotal)}</strong>
                              </div>
                              <div className={styles.vatLine}>
                                <span>VAT (7.5%)</span>
                                <strong>{currency(vatBreakdown.vatAmount)}</strong>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                      <div className={styles.staySummaryFooter}>
                        <span>
                          {stayMode === 'day_use'
                            ? 'Day stay · 12:00 PM–8:00 PM'
                            : stayNights > 0
                              ? `${stayNights}-night stay · 8:00 PM arrival–9:00 AM departure`
                              : 'Select check-in and check-out dates'}
                        </span>
                        {selectedHouse?.max_guests != null && (
                          <small>
                            Up to {selectedHouse.max_guests} guests included
                            {selectedHouse.extra_guest_fee_per_head
                              ? ` · ${currency(selectedHouse.extra_guest_fee_per_head)} per extra guest`
                              : ''}
                          </small>
                        )}
                        <small>VAT is included in the total payable.</small>
                      </div>
                    </div>
                  ) : (
                    <div className={`${styles.full} ${styles.priceSummary}`}>
                      <div className={styles.priceSummaryHeader}>
                        <span>Total payable</span>
                        <strong>{currency(estimatedTotal)}</strong>
                      </div>
                      {vatBreakdown && (
                        <div className={styles.priceLines}>
                          <div>
                            <span>Booking subtotal</span>
                            <strong>{currency(vatBreakdown.subtotal)}</strong>
                          </div>
                          <div className={styles.vatLine}>
                            <span>VAT (7.5%)</span>
                            <strong>{currency(vatBreakdown.vatAmount)}</strong>
                          </div>
                        </div>
                      )}
                      <div className={styles.staySummaryFooter}>
                        <small>VAT is included in the total payable.</small>
                      </div>
                    </div>
                  )}

                  <Button
                    className={styles.check}
                    disabled={
                      estimatedTotal == null ||
                      !date ||
                      (experience === 'beach_house' &&
                        stayMode === 'overnight' &&
                        stayNights < 1)
                    }
                    type="submit"
                  >
                    Check availability
                  </Button>
                </form>

                <div className={styles.result} aria-live="polite">
                  {availability.status === 'checking' && (
                    <p>Checking your dates...</p>
                  )}
                  {availability.status === 'unavailable' && (
                    <p className={styles.notice}>
                      That window is reserved. Select another date or time.
                    </p>
                  )}
                  {availability.status === 'curfew' && (
                    <div className={styles.afterHours}>
                      <p>
                        Online booking is available from{' '}
                        {formatBookingTime(availability.reopenTime)} to{' '}
                        {formatBookingTime(availability.curfewTime)}. This trip
                        falls outside those hours, but our team can still help
                        you book it.
                      </p>
                      <a
                        href={whatsappBookingUrl(
                          availability.whatsappNumber,
                          `Hi Gladiator, I'd like help booking ${selectedAsset.name} for ${date} outside the online booking hours.`,
                        )}
                        rel="noreferrer"
                        target="_blank"
                      >
                        Continue on WhatsApp
                      </a>
                    </div>
                  )}
                  {availability.status === 'error' && (
                    <p className={styles.notice}>
                      Availability could not be checked right now.
                    </p>
                  )}
                </div>

                {availability.status === 'available' &&
                  !confirmationReference && (
                    <div className={styles.availablePanel}>
                      <div className={styles.available}>
                        This option is available. Complete your details and pay
                        securely with Paystack to confirm the booking.
                      </div>
                      <Button
                        onClick={() => setIsBookingModalOpen(true)}
                        type="button"
                      >
                        Reserve this experience
                      </Button>
                    </div>
                  )}

                {confirmationReference && (
                  <div className={styles.confirmed}>
                    <p>Request received</p>
                    <h3>{confirmationReference}</h3>
                    <span>
                      Your booking is pending confirmation. Our team will
                      contact you using the details provided.
                    </span>
                  </div>
                )}
              </>
            )}
          </aside>
        </div>
      </div>

      <AnimatePresence>
        {gallery && (
          <motion.div
            animate={{ opacity: 1 }}
            className={styles.galleryOverlay}
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onClick={() => setGallery(null)}
            role="presentation"
            transition={{ duration: 0.18 }}
          >
            <motion.div
              animate={{ opacity: 1, scale: 1, y: 0 }}
              aria-modal="true"
              className={styles.galleryDialog}
              exit={{ opacity: 0, scale: 0.98, y: 18 }}
              initial={{ opacity: 0, scale: 0.98, y: 24 }}
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              transition={{ type: 'spring', stiffness: 280, damping: 28 }}
            >
              <div className={styles.galleryHeader}>
                <div>
                  <p>Gallery</p>
                  <h2>{gallery.listing.name}</h2>
                </div>
                <Button
                  className={styles.galleryClose}
                  onClick={() => setGallery(null)}
                  type="button"
                  variant="ghost"
                >
                  Close
                </Button>
              </div>

              <div className={styles.galleryImage}>
                <AnimatePresence mode="wait">
                  <motion.div
                    animate={{ opacity: 1, scale: 1 }}
                    className={styles.galleryImageFrame}
                    exit={{ opacity: 0, scale: 1.015 }}
                    initial={{ opacity: 0, scale: 1.015 }}
                    key={`${gallery.listing.id}-${gallery.index}`}
                    transition={{ duration: 0.22, ease: [0.22, 0.8, 0.22, 1] }}
                  >
                    <Image
                      alt={gallery.listing.name}
                      fill
                      sizes="90vw"
                      src={
                        listingImages(gallery.listing)[gallery.index] ??
                        '/images/charter-hero.png'
                      }
                    />
                  </motion.div>
                </AnimatePresence>
                {listingImages(gallery.listing).length > 1 && (
                  <>
                    <Button
                      aria-label="Previous gallery image"
                      className={`${styles.galleryControl} ${styles.galleryPrevious}`}
                      onClick={() => setGalleryImage(gallery.index - 1)}
                      type="button"
                      variant="icon"
                    >
                      <ArrowIcon direction="previous" />
                    </Button>
                    <Button
                      aria-label="Next gallery image"
                      className={`${styles.galleryControl} ${styles.galleryNext}`}
                      onClick={() => setGalleryImage(gallery.index + 1)}
                      type="button"
                      variant="icon"
                    >
                      <ArrowIcon direction="next" />
                    </Button>
                  </>
                )}
              </div>

              <div className={styles.galleryFooter}>
                <span>
                  {gallery.index + 1} of {listingImages(gallery.listing).length}
                </span>
                <div className={styles.galleryThumbs}>
                  {listingImages(gallery.listing).map((imageUrl, index) => (
                    <Button
                      aria-label={`View image ${index + 1}`}
                      className={
                        index === gallery.index ? styles.activeThumb : undefined
                      }
                      key={`${imageUrl}-${index}`}
                      onClick={() => setGalleryImage(index)}
                      type="button"
                      variant="ghost"
                    >
                      <Image
                        alt=""
                        fill
                        sizes="7.2rem"
                        src={imageUrl}
                      />
                    </Button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isBookingModalOpen && selectedAsset && (
          <motion.div
            animate={{ opacity: 1 }}
            className={styles.modalOverlay}
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onClick={closeBookingModal}
            role="presentation"
            transition={{ duration: 0.18 }}
          >
            <motion.div
              animate={{ opacity: 1, scale: 1, y: 0 }}
              aria-modal="true"
              className={styles.bookingDialog}
              exit={{ opacity: 0, scale: 0.98, y: 18 }}
              initial={{ opacity: 0, scale: 0.98, y: 24 }}
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              transition={{ type: 'spring', stiffness: 280, damping: 28 }}
            >
            <div className={styles.bookingHeader}>
              <div>
                <p>Reserve experience</p>
                <h2>{selectedAsset.name}</h2>
                <span>
                  {date}
                  {bookingEndDate && bookingEndDate !== date
                    ? ` to ${bookingEndDate}`
                    : ''}
                  {' | '}
                  {currency(estimatedTotal)}
                </span>
              </div>
              <Button
                onClick={closeBookingModal}
                type="button"
                variant="ghost"
              >
                Close
              </Button>
            </div>

            <form className={styles.bookingForm} onSubmit={submitBooking}>
              {vatBreakdown && (
                <div className={styles.paymentSummary}>
                  <div>
                    <span>Booking subtotal</span>
                    <strong>{currency(vatBreakdown.subtotal)}</strong>
                  </div>
                  <div>
                    <span>VAT (7.5%)</span>
                    <strong>{currency(vatBreakdown.vatAmount)}</strong>
                  </div>
                  <div className={styles.paymentTotal}>
                    <span>Total payable</span>
                    <strong>{currency(vatBreakdown.totalAmount)}</strong>
                  </div>
                </div>
              )}
              <FormField label="Full name">
                <TextInput
                  onChange={(event) => setCustomerName(event.target.value)}
                  required
                  type="text"
                  value={customerName}
                />
              </FormField>
              <FormField label="Email">
                <TextInput
                  onChange={(event) => setCustomerEmail(event.target.value)}
                  required
                  type="email"
                  value={customerEmail}
                />
              </FormField>
              <FormField label="Phone">
                <TextInput
                  onChange={(event) => setCustomerPhone(event.target.value)}
                  required
                  type="tel"
                  value={customerPhone}
                />
              </FormField>
              <FormField label="Occasion or requests">
                <TextArea
                  onChange={(event) => setNotes(event.target.value)}
                  rows={4}
                  value={notes}
                />
              </FormField>
              {submissionError && (
                <p className={styles.notice}>{submissionError}</p>
              )}
              <Button disabled={isPaymentStarting} type="submit">
                {isPaymentStarting ? 'Preparing payment...' : 'Continue to payment'}
              </Button>
            </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

export default ReservationPlanner;
