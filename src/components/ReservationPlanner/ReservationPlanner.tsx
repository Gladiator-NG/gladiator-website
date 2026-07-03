'use client';

import Image from 'next/image';
import { type FormEvent, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAvailabilityCheck } from '@/hooks/useAvailabilityCheck';
import { useBeachHouses } from '@/hooks/useBeachHouses';
import { useBoats, useRentalBoats } from '@/hooks/useBoats';
import { useLocations } from '@/hooks/useLocations';
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
  RentalType,
} from '@/services/apiBooking';
import { initializeBookingPayment } from '@/services/apiBooking';
import type { Boat } from '@/services/apiBoat';
import styles from './reservationPlanner.module.css';

type Experience = BookingType;
type Listing = Boat | BeachHouse;

const experienceLabels: Record<Experience, string> = {
  boat_cruise: 'Private yachts',
  beach_house: 'Waterfront stays',
  boat_rental: 'Boat transfers',
};

const experienceTabs = Object.entries(experienceLabels).map(
  ([value, label]) => ({
    label,
    value: value as Experience,
  }),
);

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

function ReservationPlanner() {
  const [experience, setExperience] = useState<Experience>('boat_cruise');
  const [location, setLocation] = useState('');
  const [assetId, setAssetId] = useState('');
  const [date, setDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [returnTime, setReturnTime] = useState('17:00');
  const [startTime, setStartTime] = useState('11:00');
  const [checkOutTime, setCheckOutTime] = useState('11:00');
  const [duration, setDuration] = useState(3);
  const [guests, setGuests] = useState(2);
  const [stayMode, setStayMode] =
    useState<BeachHouseBookingMode>('overnight');
  const [routeId, setRouteId] = useState('');
  const [rentalType, setRentalType] = useState<RentalType>('outbound');
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
  const { routes, isLoading: routesLoading } = useTransportRoutes();

  const assets: Listing[] = useMemo(() => {
    if (experience === 'beach_house') return beachHouses;
    return experience === 'boat_rental' ? rentalBoats : boats;
  }, [beachHouses, boats, experience, rentalBoats]);

  const filteredAssets = assets.filter((asset) => {
    if (!location) return true;
    if (isBoat(asset)) {
      return asset.pickup_location === location || asset.location === location;
    }
    return asset.location === location;
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
  const minimumDuration =
    experience === 'beach_house' && stayMode === 'day_use'
      ? selectedHouse?.day_use_min_hours ?? 1
      : selectedBoat?.min_booking_hours ?? 1;
  const maximumDuration =
    experience === 'beach_house' && stayMode === 'day_use'
      ? selectedHouse?.day_use_max_hours ?? undefined
      : selectedBoat?.max_booking_hours ?? undefined;
  const durationUsed = Math.max(
    minimumDuration,
    Math.min(duration, maximumDuration ?? duration),
  );
  const tripMultiplier = rentalType === 'round_trip' ? 2 : 1;
  const oneWayTransferHours = selectedRoute?.duration_hours ?? 1;
  const transferHours = oneWayTransferHours * tripMultiplier;
  const endTime =
    experience === 'boat_rental'
      ? rentalType === 'round_trip'
        ? returnTime
        : addHours(startTime, oneWayTransferHours)
      : experience === 'beach_house' && stayMode === 'overnight'
        ? checkOutTime
      : addHours(startTime, durationUsed);
  const bookingEndDate =
    experience === 'boat_rental' && rentalType === 'round_trip'
      ? returnDate
      : experience === 'beach_house'
        ? endDate
        : date;
  const stayNights = nightsBetween(date, endDate);
  const extraGuestCount =
    experience === 'beach_house' && selectedHouse?.max_guests != null
      ? Math.max(0, guests - selectedHouse.max_guests)
      : 0;
  const extraGuestCharge =
    extraGuestCount * (selectedHouse?.extra_guest_fee_per_head ?? 0);

  const estimatedTotal = (() => {
    if (experience === 'boat_cruise') {
      return selectedBoat?.price_per_hour
        ? selectedBoat.price_per_hour * durationUsed
        : null;
    }

    if (experience === 'boat_rental') {
      return selectedRoute?.route_price
        ? selectedRoute.route_price * tripMultiplier
        : null;
    }

    if (stayMode === 'day_use') {
      return selectedHouse?.day_use_price_per_hour
        ? selectedHouse.day_use_price_per_hour * durationUsed + extraGuestCharge
        : null;
    }

    return selectedHouse?.price_per_night && stayNights > 0
      ? selectedHouse.price_per_night * stayNights + extraGuestCharge
      : null;
  })();

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
    setReturnDate('');
    setIsBeachHouseTransfer(false);
    setBeachHouseBookingReference('');
    setCheckOutTime('11:00');
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
      setStartTime(listing.check_in_time ?? '14:00');
      setCheckOutTime(listing.check_out_time ?? '11:00');
      if (stayMode === 'day_use') {
        setDuration(listing.day_use_min_hours ?? 1);
      }
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
        startTime: startTime || selectedHouse?.check_in_time || null,
        endTime: checkOutTime || selectedHouse?.check_out_time || null,
      };
    }

    if (experience === 'boat_rental') {
      if (!selectedRoute) return null;
      if (isBeachHouseTransfer && !beachHouseBookingReference.trim()) {
        return null;
      }
      if (rentalType === 'round_trip') {
        if (!returnDate || !returnTime || returnDate < date) return null;
        if (returnDate === date && returnTime <= startTime) return null;
      }
    }

    return {
      resourceType: experience === 'beach_house' ? 'beach_house' : 'boat',
      resourceId: selectedAsset.id,
      startDate: date,
      endDate:
        experience === 'boat_rental' && rentalType === 'round_trip'
          ? returnDate
          : date,
      startTime,
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
          : experience === 'boat_rental'
            ? transferHours
            : durationUsed,
      rental_type: experience === 'boat_rental' ? rentalType : null,
      rental_route_id: experience === 'boat_rental' ? routeId : null,
      parent_beach_house_booking_reference:
        experience === 'boat_rental' && isBeachHouseTransfer
          ? beachHouseBookingReference.trim()
          : null,
      pickup_location:
        experience === 'boat_rental'
          ? selectedRoute?.from_location?.name
          : selectedBoat?.pickup_location,
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
        <FormField label="Location">
          <SelectInput
            value={location}
            onChange={(event) => setLocation(event.target.value)}
          >
            <option value="">All Lagos destinations</option>
            {locations.map((place) => (
              <option key={place.id} value={place.name}>
                {place.name}
              </option>
            ))}
          </SelectInput>
        </FormField>
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
                  : `${currency(listing.price_per_night)} / night`;

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
                            ? listing.pickup_location || listing.location
                            : listing.location}
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
                        <strong>{rate}</strong>
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
                        : 'Private charter'}
                  </p>
                  <h2>{selectedAsset.name}</h2>
                  <span>
                    Up to {selectedAsset.max_guests ?? '-'} guests
                    {' | '}
                    {selectedAsset.location}
                  </span>
                </div>

                <form className={styles.schedule} onSubmit={handleAvailability}>
                  {experience === 'beach_house' && (
                    <FormField className={styles.full} label="Stay type">
                      <SelectInput
                        value={stayMode}
                        onChange={(event) => {
                          const value = event.target
                            .value as BeachHouseBookingMode;
                          setStayMode(value);
                          if (value === 'overnight') {
                            setStartTime(selectedHouse?.check_in_time ?? '14:00');
                            setCheckOutTime(
                              selectedHouse?.check_out_time ?? '11:00',
                            );
                          }
                          setDuration(
                            value === 'day_use'
                              ? selectedHouse?.day_use_min_hours ?? 1
                              : 1,
                          );
                          resetOutcome();
                        }}
                      >
                        <option value="overnight">Overnight stay</option>
                        <option value="day_use">Day use</option>
                      </SelectInput>
                    </FormField>
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
                          {routes.map((route) => (
                            <option key={route.id} value={route.id}>
                              {route.from_location?.name} to{' '}
                              {route.to_location?.name}
                            </option>
                          ))}
                        </SelectInput>
                      </FormField>
                      <FormField className={styles.full} label="Journey">
                        <SelectInput
                          value={rentalType}
                          onChange={(event) => {
                            setRentalType(event.target.value as RentalType);
                            if (!returnDate) setReturnDate(date);
                            resetOutcome();
                          }}
                        >
                          <option value="outbound">One way</option>
                          <option value="round_trip">Round trip</option>
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
                        if (
                          experience === 'boat_rental' &&
                          rentalType === 'round_trip' &&
                          (!returnDate || returnDate < event.target.value)
                        ) {
                          setReturnDate(event.target.value);
                        }
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
                  ) : (
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

                  {experience === 'beach_house' &&
                    stayMode === 'overnight' && (
                      <>
                        <FormField label="Check-in time">
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
                        <FormField label="Checkout time">
                          <TextInput
                            onChange={(event) => {
                              setCheckOutTime(event.target.value);
                              resetOutcome();
                            }}
                            required
                            type="time"
                            value={checkOutTime}
                          />
                        </FormField>
                      </>
                    )}

                  {experience === 'boat_rental' &&
                    rentalType === 'round_trip' && (
                      <>
                        <FormField label="Return date">
                          <TextInput
                            min={date || minimumDate}
                            onChange={(event) => {
                              setReturnDate(event.target.value);
                              resetOutcome();
                            }}
                            required
                            type="date"
                            value={returnDate}
                          />
                        </FormField>
                        <FormField label="Return time">
                          <TextInput
                            onChange={(event) => {
                              setReturnTime(event.target.value);
                              resetOutcome();
                            }}
                            required
                            type="time"
                            value={returnTime}
                          />
                        </FormField>
                      </>
                    )}

                  <FormField label="Total guests">
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

                  {experience !== 'boat_rental' &&
                    (experience !== 'beach_house' ||
                      stayMode === 'day_use') && (
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

                  <div className={styles.price}>
                    <span>Estimated total</span>
                    <strong>{currency(estimatedTotal)}</strong>
                    {experience === 'beach_house' &&
                      stayMode === 'overnight' &&
                      stayNights > 0 && <small>{stayNights} night stay</small>}
                    {experience === 'beach_house' &&
                      stayMode === 'overnight' && (
                        <small>
                          Check-in: {startTime}
                          {' · '}
                          Checkout: {checkOutTime}
                        </small>
                      )}
                    {experience === 'beach_house' &&
                      selectedHouse?.max_guests != null && (
                        <small>
                          {selectedHouse.max_guests} guests included
                          {selectedHouse.extra_guest_fee_per_head
                            ? ` · ${currency(selectedHouse.extra_guest_fee_per_head)} per extra guest`
                            : ''}
                          {extraGuestCount > 0
                            ? ` · ${extraGuestCount} extra guest${extraGuestCount === 1 ? '' : 's'}`
                            : ''}
                        </small>
                      )}
                    {experience === 'boat_rental' &&
                      rentalType === 'round_trip' &&
                      returnDate &&
                      returnTime && (
                        <small>
                          Return pickup: {returnDate} at {returnTime}
                        </small>
                      )}
                  </div>

                  <Button className={styles.check} type="submit">
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
                    <p className={styles.notice}>
                      Boat operations conclude by {availability.curfewTime}.
                    </p>
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
