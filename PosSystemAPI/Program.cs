using Microsoft.EntityFrameworkCore;
using PosSystem.Domain.Interfaces;
using PosSystem.Infrastructure.Data;
using PosSystem.Infrastructure.Repositories;

var builder = WebApplication.CreateBuilder(args);


builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));


builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

var app = builder.Build();


app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.UseStaticFiles();

app.UseCors(policy => policy
    .AllowAnyOrigin()
    .AllowAnyMethod()
    .AllowAnyHeader());

app.Run();