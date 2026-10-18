using Microsoft.EntityFrameworkCore;
using PosSystem.Domain.Entities;

namespace PosSystem.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    // Mapeo de las entidades de Dominio con las tablas de SQL Server
    public DbSet<Customer> Customer => Set<Customer>();
    public DbSet<Product> Product => Set<Product>();
    public DbSet<SalesOrder> SalesOrder => Set<SalesOrder>();
    public DbSet<OrderDetail> OrderDetail => Set<OrderDetail>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

       
        modelBuilder.Entity<Customer>().ToTable("Customer");
        modelBuilder.Entity<Product>().ToTable("Product");
        modelBuilder.Entity<SalesOrder>().ToTable("SalesOrder");
        modelBuilder.Entity<OrderDetail>().ToTable("OrderDetail");
    }
}