namespace PosSystem.Domain.Entities;

public class Product
{
    public Guid Id { get; private set; }
    public string Name { get; private set; }
    public decimal UnitPrice { get; private set; }
    public int Stock { get; private set; }
    public bool IsActive { get; private set; }

    public Product(string name, decimal unitPrice, int stock)
    {
        Id = Guid.NewGuid();
        Name = name;
        UnitPrice = unitPrice;
        Stock = stock;
        IsActive = true;
    }

    // Regla de Negocio (Requisito 7 y 9): Disminución controlada de inventario
    public void ReduceStock(int quantity)
    {
        if (quantity <= 0) throw new ArgumentException("Quantity must be greater than zero.");
        if (Stock < quantity) throw new InvalidOperationException("Insufficient stock to complete the sale.");

        Stock -= quantity;
    }
}