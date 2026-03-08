using Microsoft.EntityFrameworkCore;
using dotnetapp.Data;
using dotnetapp.Exceptions;
using dotnetapp.Models;

namespace dotnetapp.Services
{
    /// <summary>
    /// Service for booking-related database operations
    /// </summary>
    public class BookingService
    {
        private readonly ApplicationDbContext _context;

        public BookingService(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>Retrieves a booking by its ID</summary>
        public async Task<Booking?> GetBookingByIdAsync(long id)
        {
            return await _context.Bookings.FindAsync(id);
        }

        /// <summary>Retrieves all bookings for a specific user with related data</summary>
        public async Task<IEnumerable<Booking>> GetBookingsByUserIdAsync(long userId)
        {
            return await _context.Bookings
                .Include(b => b.PartyHall)
                .Include(b => b.User)
                .Where(b => b.UserId == userId)
                .ToListAsync();
        }

        /// <summary>Retrieves all bookings with related party hall and user data</summary>
        public async Task<IEnumerable<Booking>> GetAllBookingsAsync()
        {
            return await _context.Bookings
                .Include(b => b.PartyHall)
                .Include(b => b.User)
                .ToListAsync();
        }

        /// <summary>Adds a new booking to the database with capacity and date validation</summary>
        public async Task<Booking> AddBookingAsync(Booking booking)
        {
            // Past date check
            if (booking.FromDate.Date < DateTime.Today)
                throw new PartyHallException("Booking date cannot be in the past.");

            if (booking.ToDate.Date < booking.FromDate.Date)
                throw new PartyHallException("End date must be on or after the start date.");

            // Capacity check — sum persons in overlapping non-cancelled bookings
            var hall = await _context.PartyHalls.FindAsync(booking.PartyHallId);
            if (hall == null)
                throw new PartyHallException("Party hall not found.");

            if (hall.HallAvailableStatus != "Available")
                throw new PartyHallException("This party hall is not available for booking.");

            var overlappingPersons = await _context.Bookings
                .Where(b => b.PartyHallId == booking.PartyHallId
                         && b.Status != "Cancelled"
                         && b.FromDate.Date <= booking.ToDate.Date
                         && b.ToDate.Date >= booking.FromDate.Date)
                .SumAsync(b => (int?)b.NoOfPersons) ?? 0;

            if (overlappingPersons + booking.NoOfPersons > hall.Capacity)
                throw new PartyHallException(
                    $"Booking exceeds hall capacity. Available capacity for selected dates: {hall.Capacity - overlappingPersons} persons.");

            _context.Bookings.Add(booking);
            await _context.SaveChangesAsync();
            return booking;
        }

        /// <summary>Deletes a booking by its ID</summary>
        public async Task DeleteBookingAsync(long id)
        {
            var booking = await _context.Bookings.FindAsync(id);
            if (booking != null)
            {
                _context.Bookings.Remove(booking);
                await _context.SaveChangesAsync();
            }
        }

        /// <summary>Updates the status of an existing booking</summary>
        public async Task UpdateBookingStatusAsync(long id, string newStatus)
        {
            var booking = await _context.Bookings.FindAsync(id);
            if (booking == null)
                throw new Exception($"Booking with ID {id} not found.");

            booking.Status = newStatus;
            await _context.SaveChangesAsync();
        }
    }
}
