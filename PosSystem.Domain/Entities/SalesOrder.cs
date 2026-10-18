namespace PosSystem.Domain.Entities;

public class SalesOrder
{
    public Guid Id { get; private set; }
    public Guid CustomerId { get; private set; }
    public DateTime IssueDate { get; private set; }
    public decimal Subtotal { get; private set; }
    public decimal VatAmount { get; private set; }
    public decimal TotalAmount { get; private set; }

    // Lista protegida para evitar modificaciones externas (Encapsulamiento)
    private readonly List<OrderDetail> _details = new();
    public IReadOnlyCollection<OrderDetail> Details => _details.AsReadOnly();

    public SalesOrder(Guid customerId)
    {
        Id = Guid.NewGuid();
        CustomerId = customerId;
        IssueDate = DateTime.Now;
    }

    // Regla de Negocio (Requisito 4): Cálculos automáticos al agregar productos
    public void AddDetail(Guid productId, int quantity, decimal priceAtSale)
    {
        // Requisito 3: No permitir productos duplicados en la misma orden
        if (_details.Any(d => d.ProductId == productId))
        {
            throw new InvalidOperationException("Product is already in the order.");
        }

        var detail = new OrderDetail(Id, productId, quantity, priceAtSale);
        _details.Add(detail);

        RecalculateTotals();
    }

    private void RecalculateTotals()
    {
        Subtotal = _details.Sum(d => d.LineTotal);
        VatAmount = Subtotal * 0.15m; // IVA del 15% 
        TotalAmount = Subtotal + VatAmount;
    }
}