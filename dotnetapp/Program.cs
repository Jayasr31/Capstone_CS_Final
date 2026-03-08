using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using dotnetapp.Data;
using dotnetapp.Models;
using dotnetapp.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Handle circular references
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });

// Configure SQL Server
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Register services
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<ReviewService>();
builder.Services.AddScoped<BookingService>();
builder.Services.AddScoped<PartyHallService>();

// Configure JWT Authentication
var jwtKey = builder.Configuration["JWT:Key"]!;
var jwtIssuer = builder.Configuration["JWT:Issuer"];
var jwtAudience = builder.Configuration["JWT:Audience"];

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
    };
});

// Configure CORS to allow Angular frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
    {
        policy.WithOrigins("http://localhost:8081", "http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure HTTP pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAngular");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Apply migrations and seed default data
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    db.Database.Migrate();

    // Seed party halls only if none exist
    if (!db.PartyHalls.Any())
    {
        var halls = new List<PartyHall>
        {
            new PartyHall {
                HallName = "Grand Celebration Hall",
                HallLocation = "Bandra West, Mumbai",
                FullAddress = "Linking Road, Bandra West, Mumbai, Maharashtra 400050",
                HallImageUrl = "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800",
                HallAvailableStatus = "Available",
                Price = 85000,
                Capacity = 500,
                Theme = "Royal",
                Description = "A lavish banquet hall in the heart of Bandra West, perfect for grand weddings and corporate galas. Features a stunning chandelier ceiling, dedicated stage, and premium catering.",
                AdditionalImages = "[\"https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800\",\"https://images.unsplash.com/photo-1478146059778-26028b07395a?w=800\"]"
            },
            new PartyHall {
                HallName = "Marine Breeze Convention",
                HallLocation = "Marine Lines, Mumbai",
                FullAddress = "Marine Lines, Churchgate, Mumbai, Maharashtra 400020",
                HallImageUrl = "https://images.unsplash.com/photo-1531058020387-3be344556be6?w=800",
                HallAvailableStatus = "Available",
                Price = 120000,
                Capacity = 800,
                Theme = "Modern",
                Description = "Overlooking the iconic Marine Drive with a sea-view terrace, this venue is ideal for large conferences, receptions, and cultural events with full AV setup.",
                AdditionalImages = "[\"https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800\",\"https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=800\"]"
            },
            new PartyHall {
                HallName = "Andheri Star Banquet",
                HallLocation = "Andheri East, Mumbai",
                FullAddress = "MIDC Road, Andheri East, Mumbai, Maharashtra 400093",
                HallImageUrl = "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800",
                HallAvailableStatus = "Available",
                Price = 55000,
                Capacity = 300,
                Theme = "Contemporary",
                Description = "A stylish, affordable banquet hall near the airport with modern interiors, in-house catering, and ample parking. Perfect for birthday parties, engagements, and small weddings.",
                AdditionalImages = "[\"https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800\",\"https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800\"]"
            },
            new PartyHall {
                HallName = "Powai Lakeside Retreat",
                HallLocation = "Powai, Mumbai",
                FullAddress = "Hiranandani Gardens, Powai, Mumbai, Maharashtra 400076",
                HallImageUrl = "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800",
                HallAvailableStatus = "Available",
                Price = 95000,
                Capacity = 450,
                Theme = "Garden",
                Description = "Nestled alongside Powai Lake, this open-air and indoor venue offers breathtaking waterfront views. Ideal for destination-feel celebrations without leaving the city.",
                AdditionalImages = "[\"https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800\",\"https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800\"]"
            },
            new PartyHall {
                HallName = "Juhu Beach Pavilion",
                HallLocation = "Juhu, Mumbai",
                FullAddress = "Juhu Beach Road, Juhu, Mumbai, Maharashtra 400049",
                HallImageUrl = "https://images.unsplash.com/photo-1516997121675-4c2d1684aa3e?w=800",
                HallAvailableStatus = "Available",
                Price = 110000,
                Capacity = 600,
                Theme = "Beachside",
                Description = "An exclusive beachfront pavilion steps away from Juhu Beach. Host sunset weddings or cocktail parties with the sound of waves as your backdrop. Open-air and climate-controlled options.",
                AdditionalImages = "[\"https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800\",\"https://images.unsplash.com/photo-1510076857177-7470076d4098?w=800\"]"
            },
            new PartyHall {
                HallName = "Worli Sky Lounge",
                HallLocation = "Worli, Mumbai",
                FullAddress = "Worli Sea Face, Worli, Mumbai, Maharashtra 400030",
                HallImageUrl = "https://images.unsplash.com/photo-1551818255-e6e10975bc17?w=800",
                HallAvailableStatus = "Available",
                Price = 150000,
                Capacity = 350,
                Theme = "Rooftop Luxury",
                Description = "A premium rooftop venue on the 28th floor with panoramic views of the Bandra-Worli Sea Link. Perfect for high-end corporate events, product launches, and intimate luxury weddings.",
                AdditionalImages = "[\"https://images.unsplash.com/photo-1508997449629-303059a039c0?w=800\",\"https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800\"]"
            },
            new PartyHall {
                HallName = "Thane Heritage Mahal",
                HallLocation = "Thane West, Mumbai",
                FullAddress = "Gokhale Road, Thane West, Thane, Maharashtra 400602",
                HallImageUrl = "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800",
                HallAvailableStatus = "Available",
                Price = 45000,
                Capacity = 250,
                Theme = "Heritage",
                Description = "A beautifully restored heritage-themed hall in Thane with traditional Mughal architecture, ornate pillars, and warm lighting. Great for mehndi, sangeet, and family gatherings.",
                AdditionalImages = "[\"https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800\",\"https://images.unsplash.com/photo-1478146059778-26028b07395a?w=800\"]"
            },
            new PartyHall {
                HallName = "Malad Garden Fiesta",
                HallLocation = "Malad West, Mumbai",
                FullAddress = "Marve Road, Malad West, Mumbai, Maharashtra 400064",
                HallImageUrl = "https://images.unsplash.com/photo-1478146059778-26028b07395a?w=800",
                HallAvailableStatus = "Available",
                Price = 60000,
                Capacity = 400,
                Theme = "Garden Party",
                Description = "A lush green outdoor garden venue in Malad with fairy lights, floral decor, and a spacious lawn. Ideal for birthday parties, anniversary celebrations, and casual receptions.",
                AdditionalImages = "[\"https://images.unsplash.com/photo-1519741497674-611481863552?w=800\",\"https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800\"]"
            }
        };
        db.PartyHalls.AddRange(halls);
        db.SaveChanges();
    }
}

app.Run("http://0.0.0.0:8080");
