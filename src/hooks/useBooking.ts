import { useState, useEffect, useCallback } from 'react';
import {
    BookingQuoteRequest,
    BookingQuoteResponse,
    CreateBookingRequest,
    AvailabilityResponse,
    CalendarResponse,
    getBookingQuote,
    createBooking,
    checkAvailability,
    getCalendar,
    handleApiError,
    formatDateForApi
} from '../services/api';

export interface BookingFormData {
    guest_name: string;
    guest_surname: string;
    guest_email: string;
    guest_phone: string;
    check_in_date: Date | null;
    check_out_date: Date | null;
    num_adults: number;
    num_children: number;
    children_ages: number[];
    parking_option: 'none' | 'street' | 'private';
    payment_method: 'stripe' | 'paypal' | 'bank_transfer';
    payment_type: 'deposit' | 'full';
    guest_message: string;
}

export interface BookingState {
    // Form data
    formData: BookingFormData;
    setFormData: (data: Partial<BookingFormData>) => void;
    
    // Quote management
    quote: BookingQuoteResponse | null;
    isLoadingQuote: boolean;
    quoteError: string | null;
    requestQuote: () => Promise<void>;
    
    // Availability
    availability: AvailabilityResponse | null;
    isCheckingAvailability: boolean;
    availabilityError: string | null;
    checkDatesAvailability: (checkIn: Date, checkOut: Date) => Promise<boolean>;
    
    // Calendar
    calendar: CalendarResponse | null;
    isLoadingCalendar: boolean;
    calendarError: string | null;
    loadCalendar: (startDate?: Date, endDate?: Date) => Promise<void>;
    
    // Booking creation
    isCreatingBooking: boolean;
    bookingError: string | null;
    bookingResult: any | null;
    submitBooking: () => Promise<void>;
    
    // Validation
    formErrors: Record<string, string>;
    isFormValid: boolean;
    validateForm: () => boolean;
    
    // Utils
    resetForm: () => void;
    resetErrors: () => void;
}

const initialFormData: BookingFormData = {
    guest_name: '',
    guest_surname: '',
    guest_email: '',
    guest_phone: '',
    check_in_date: null,
    check_out_date: null,
    num_adults: 2,
    num_children: 0,
    children_ages: [],
    parking_option: 'none',
    payment_method: 'stripe',
    payment_type: 'deposit',
    guest_message: ''
};

export function useBooking(): BookingState {
    // Form state
    const [formData, setFormDataState] = useState<BookingFormData>(initialFormData);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    
    // Quote state
    const [quote, setQuote] = useState<BookingQuoteResponse | null>(null);
    const [isLoadingQuote, setIsLoadingQuote] = useState(false);
    const [quoteError, setQuoteError] = useState<string | null>(null);
    
    // Availability state
    const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
    const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
    const [availabilityError, setAvailabilityError] = useState<string | null>(null);
    
    // Calendar state
    const [calendar, setCalendar] = useState<CalendarResponse | null>(null);
    const [isLoadingCalendar, setIsLoadingCalendar] = useState(false);
    const [calendarError, setCalendarError] = useState<string | null>(null);
    
    // Booking state
    const [isCreatingBooking, setIsCreatingBooking] = useState(false);
    const [bookingError, setBookingError] = useState<string | null>(null);
    const [bookingResult, setBookingResult] = useState<any | null>(null);
    
    // Form data setter with validation
    const setFormData = useCallback((data: Partial<BookingFormData>) => {
        setFormDataState(prev => ({ ...prev, ...data }));
        setFormErrors({}); // Reset errors when form changes
        setQuote(null); // Reset quote when form changes
    }, []);
    
    // Validation
    const validateForm = useCallback((): boolean => {
        const errors: Record<string, string> = {};
        
        if (!formData.guest_name.trim()) {
            errors.guest_name = 'Nome obbligatorio';
        }
        
        if (!formData.guest_surname.trim()) {
            errors.guest_surname = 'Cognome obbligatorio';
        }
        
        if (!formData.guest_email.trim()) {
            errors.guest_email = 'Email obbligatoria';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.guest_email)) {
            errors.guest_email = 'Email non valida';
        }
        
        if (!formData.guest_phone.trim()) {
            errors.guest_phone = 'Telefono obbligatorio';
        }
        
        if (!formData.check_in_date) {
            errors.check_in_date = 'Data check-in obbligatoria';
        }
        
        if (!formData.check_out_date) {
            errors.check_out_date = 'Data check-out obbligatoria';
        }
        
        if (formData.check_in_date && formData.check_out_date && formData.check_out_date <= formData.check_in_date) {
            errors.check_out_date = 'Data check-out deve essere successiva al check-in';
        }
        
        if (formData.num_adults < 1) {
            errors.num_adults = 'Almeno 1 adulto richiesto';
        }
        
        if (formData.num_children > 0 && formData.children_ages.length !== formData.num_children) {
            errors.children_ages = 'Inserire l\'età di tutti i bambini';
        }
        
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    }, [formData]);
    
    const isFormValid = Object.keys(formErrors).length === 0 && 
                        !!formData.guest_name && 
                        !!formData.guest_email && 
                        !!formData.check_in_date && 
                        !!formData.check_out_date;
    
    // Quote request
    const requestQuote = useCallback(async () => {
        console.log('📋 Requesting quote with data:', {
            checkIn: formData.check_in_date,
            checkOut: formData.check_out_date,
            adults: formData.num_adults,
            children: formData.num_children,
            parking: formData.parking_option
        });
        
        if (!formData.check_in_date || !formData.check_out_date) {
            console.log('⚠️ Quote request aborted - missing dates');
            setQuoteError('Date check-in e check-out obbligatorie');
            return;
        }
        
        setIsLoadingQuote(true);
        setQuoteError(null);
        
        try {
            const quoteRequest: BookingQuoteRequest = {
                checkIn: formatDateForApi(formData.check_in_date),
                checkOut: formatDateForApi(formData.check_out_date),
                guests: formData.num_adults + formData.num_children,
                includeParking: formData.parking_option === 'private'
            };
            
            console.log('🚀 Sending quote request:', quoteRequest);
            const response = await getBookingQuote(quoteRequest);
            console.log('✅ Quote response received:', response);
            setQuote(response);
        } catch (error) {
            console.error('❌ Quote request failed:', error);
            setQuoteError(handleApiError(error));
        } finally {
            setIsLoadingQuote(false);
        }
    }, [formData]);
    
    // Availability check
    const checkDatesAvailability = useCallback(async (checkIn: Date, checkOut: Date): Promise<boolean> => {
        setIsCheckingAvailability(true);
        setAvailabilityError(null);
        
        try {
            const response = await checkAvailability({
                check_in_date: formatDateForApi(checkIn),
                check_out_date: formatDateForApi(checkOut)
            });
            
            setAvailability(response);
            return response.available;
        } catch (error) {
            setAvailabilityError(handleApiError(error));
            return false;
        } finally {
            setIsCheckingAvailability(false);
        }
    }, []);
    
    // Calendar loading
    const loadCalendar = useCallback(async (startDate?: Date, endDate?: Date) => {
        setIsLoadingCalendar(true);
        setCalendarError(null);
        
        try {
            const response = await getCalendar(
                startDate ? formatDateForApi(startDate) : undefined,
                endDate ? formatDateForApi(endDate) : undefined
            );
            
            setCalendar(response);
        } catch (error) {
            setCalendarError(handleApiError(error));
        } finally {
            setIsLoadingCalendar(false);
        }
    }, []);
    
    // Booking submission
    const submitBooking = useCallback(async () => {
        if (!validateForm()) {
            return;
        }
        
        if (!formData.check_in_date || !formData.check_out_date) {
            setBookingError('Date check-in e check-out obbligatorie');
            return;
        }
        
        setIsCreatingBooking(true);
        setBookingError(null);
        
        try {
            const bookingRequest: CreateBookingRequest = {
                guest_name: formData.guest_name,
                guest_surname: formData.guest_surname,
                guest_email: formData.guest_email,
                guest_phone: formData.guest_phone,
                check_in_date: formatDateForApi(formData.check_in_date),
                check_out_date: formatDateForApi(formData.check_out_date),
                num_adults: formData.num_adults,
                num_children: formData.num_children,
                children_ages: formData.children_ages,
                parking_option: formData.parking_option,
                payment_method: formData.payment_method,
                payment_type: formData.payment_type,
                guest_message: formData.guest_message
            };
            
            const response = await createBooking(bookingRequest);
            setBookingResult(response);
        } catch (error) {
            setBookingError(handleApiError(error));
        } finally {
            setIsCreatingBooking(false);
        }
    }, [formData, validateForm]);
    
    // Reset functions
    const resetForm = useCallback(() => {
        setFormDataState(initialFormData);
        setFormErrors({});
        setQuote(null);
        setAvailability(null);
        setBookingResult(null);
        resetErrors();
    }, []);
    
    const resetErrors = useCallback(() => {
        setQuoteError(null);
        setAvailabilityError(null);
        setCalendarError(null);
        setBookingError(null);
        setFormErrors({});
    }, []);
    
    // Auto-request quote when dates and guests change
    useEffect(() => {
        if (formData.check_in_date && formData.check_out_date && formData.num_adults > 0) {
            console.log('🔄 Trigger auto-quote request:', {
                checkIn: formData.check_in_date,
                checkOut: formData.check_out_date,
                adults: formData.num_adults,
                children: formData.num_children,
                parking: formData.parking_option
            });
            
            const timer = setTimeout(() => {
                requestQuote();
            }, 300); // Ridotto debounce per risposta più veloce
            
            return () => clearTimeout(timer);
        } else {
            console.log('⚠️ Auto-quote skipped - missing data:', {
                hasCheckIn: !!formData.check_in_date,
                hasCheckOut: !!formData.check_out_date,
                adults: formData.num_adults
            });
        }
    }, [formData.check_in_date, formData.check_out_date, formData.num_adults, formData.num_children, formData.parking_option, requestQuote]);
    
    // Load calendar on mount
    useEffect(() => {
        loadCalendar();
    }, [loadCalendar]);
    
    return {
        // Form data
        formData,
        setFormData,
        
        // Quote management
        quote,
        isLoadingQuote,
        quoteError,
        requestQuote,
        
        // Availability
        availability,
        isCheckingAvailability,
        availabilityError,
        checkDatesAvailability,
        
        // Calendar
        calendar,
        isLoadingCalendar,
        calendarError,
        loadCalendar,
        
        // Booking creation
        isCreatingBooking,
        bookingError,
        bookingResult,
        submitBooking,
        
        // Validation
        formErrors,
        isFormValid,
        validateForm,
        
        // Utils
        resetForm,
        resetErrors
    };
}