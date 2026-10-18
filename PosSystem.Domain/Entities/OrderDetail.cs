namespace PosSystem.Domain.Entities;

public class OrderDetail
{
    public Guid Id { get; private set; }
    public Guid SalesOrderId { get; private set; }
    public Guid ProductId { get; private set; }
    public int Quantity { get; private set; }
    public decimal PriceAtSale { get; private set; }
    public decimal LineTotal { get; private set; }

    public OrderDetail(Guid salesOrderId, Guid productId, int quantity, decimal priceAtSale)
    {
        Id = Guid.NewGuid();
        SalesOrderId = salesOrderId;
        ProductId = productId;
        Quantity = quantity;
        PriceAtSale = priceAtSale;
        LineTotal = quantity * priceAtSale; // Cálculo automático
    }
}