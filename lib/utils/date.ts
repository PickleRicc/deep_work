/**
 * Get the current date in YYYY-MM-DD format using the user's local timezone
 * This prevents timezone offset issues (e.g., EST being 5 hours behind UTC)
 * 
 * WARNING: On the server, this returns the SERVER's local date (typically UTC).
 * For server components, use getUserLocalDateString() with the user's timezone.
 */
export function getLocalDateString(date: Date = new Date()): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Get the current date in YYYY-MM-DD format for a specific timezone
 * Use this in server components to get the user's local date
 * 
 * @param timezone - IANA timezone identifier (e.g., 'America/New_York')
 * @param date - Optional date to convert (defaults to now)
 */
export function getDateInTimezone(timezone: string = 'America/New_York', date: Date = new Date()): string {
    try {
        // Use Intl.DateTimeFormat to get the date parts in the target timezone
        const formatter = new Intl.DateTimeFormat('en-CA', {
            timeZone: timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
        // en-CA format gives us YYYY-MM-DD directly
        return formatter.format(date);
    } catch (error) {
        // Fallback to local date if timezone is invalid
        console.error(`Invalid timezone: ${timezone}, falling back to local date`);
        return getLocalDateString(date);
    }
}

/**
 * Get the current time in HH:MM format for a specific timezone
 */
export function getTimeInTimezone(timezone: string = 'America/New_York', date: Date = new Date()): string {
    try {
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        });
        return formatter.format(date);
    } catch (error) {
        console.error(`Invalid timezone: ${timezone}`);
        return date.toTimeString().slice(0, 5);
    }
}

/**
 * Add days to a date and return local date string
 */
export function addDays(date: Date, days: number): string {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + days);
    return getLocalDateString(newDate);
}

/**
 * Parse a date string (YYYY-MM-DD) to a Date object at noon local time
 * This prevents day-shifting when working with dates
 */
export function parseDateString(dateStr: string): Date {
    return new Date(dateStr + 'T12:00:00');
}

/**
 * Convert 24-hour time string (HH:MM or HH:MM:SS) to 12-hour format
 * @param time24 - Time string in 24-hour format (e.g., "14:30" or "14:30:00")
 * @returns Time string in 12-hour format (e.g., "2:30 PM")
 */
export function format12Hour(time24: string): string {
    if (!time24) return '';
    
    const [hourStr, minuteStr] = time24.split(':');
    const hour = parseInt(hourStr, 10);
    const minute = minuteStr || '00';
    
    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    
    return `${hour12}:${minute} ${period}`;
}

/**
 * Get current time in 12-hour format
 */
export function getCurrentTime12Hour(): string {
    const now = new Date();
    const hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    
    return `${hour12}:${minutes} ${period}`;
}

