using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PosSystem.Domain.Entities;
using PosSystem.Domain.Interfaces;
using PosSystem.Infrastructure.Data;


namespace PosSystem.API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class SalesOrdersController : ControllerBase

{
    private readonly AppDbContext _context;
    private readonly IRepository<SalesOrder> _orderRepository;
    private readonly IRepository<Product> _productRepository;

    public SalesOrdersController(
        AppDbContext context,
        IRepository<SalesOrder> orderRepository,
        IRepository<Product> productRepository)
    {
        _context = context;
        _orderRepository = orderRepository;
        _productRepository = productRepository;
    }

    // DTO para recibir la petición desde el Front-End
    public class CreateOrderDto
    {
        public Guid CustomerId { get; set; }
        public List<OrderDetailDto> Items { get; set; } = new();
    }

    public class OrderDetailDto
    {
        public Guid ProductId { get; set; }
        public int Quantity { get; set; }
    }
    // Servicio REST GET: Permite listar todas las órdenes de venta registradas
    [HttpGet]
    public IActionResult GetOrders()
    {
        var orders = _orderRepository.GetAll();
        return Ok(orders);
    }

    // Servicio REST GET: Devuelve UNA factura con su detalle completo de productos
    // Servicio REST GET: Devuelve UNA factura con su detalle completo de productos y datos del cliente
    // Servicio REST GET: Devuelve UNA factura con su detalle completo de productos y datos del cliente
    [HttpGet("{id}")]
    public IActionResult GetOrderById(Guid id)
    {
        // Usamos el contexto con .Include para garantizar que los detalles viajen desde la base de datos
        var order = _context.SalesOrder
            .Include(o => o.Details)
            .FirstOrDefault(o => o.Id == id);

        if (order == null)
        {
            return NotFound(new { message = $"Order with ID {id} not found." });
        }

        // Buscamos los datos del cliente asociado
        var customer = _context.Customer.FirstOrDefault(c => c.Id == order.CustomerId);

        // Los detalles solo guardan ProductId, así que buscamos los nombres de producto
        var productIds = order.Details.Select(d => d.ProductId).ToList();
        var products = _context.Product
            .Where(p => productIds.Contains(p.Id))
            .ToDictionary(p => p.Id, p => p.Name);

        var response = new
        {
            id = order.Id,
            customerId = order.CustomerId,
            customer = customer != null ? new
            {
                identificationCard = customer.IdentificationCard,
                fullName = customer.FullName,
                address = "Ecuador"
            } : null,
            issueDate = order.IssueDate,
            subtotal = order.Subtotal,
            vatAmount = order.VatAmount,
            totalAmount = order.TotalAmount,
            details = order.Details.Select(d => new
            {
                productId = d.ProductId,
                productName = products.ContainsKey(d.ProductId) ? products[d.ProductId] : "Producto no encontrado",
                quantity = d.Quantity,
                unitPrice = d.PriceAtSale,
                lineTotal = d.LineTotal
            })
        };

        return Ok(response);
    }
    // Servicio REST POST para crear una factura (Requisito 4, 7, 9 y 21)
    [HttpPost]
    public IActionResult CreateOrder([FromBody] CreateOrderDto dto)
    {
        // Usamos una transacción de base de datos para garantizar integridad total (Req 9)
        using var transaction = _context.Database.BeginTransaction();
        try
        {
            // 1. Crear la orden de venta para el cliente
            var salesOrder = new SalesOrder(dto.CustomerId);

            foreach (var item in dto.Items)
            {
                // 2. Buscar el producto en la base de datos
                var product = _productRepository.GetById(item.ProductId);
                if (product == null || !product.IsActive)
                {
                    return BadRequest(new { message = $"Product with ID {item.ProductId} not found or inactive." });
                }

                // 3. Aplicar regla de negocio de inventario (Reduce stock de forma segura)
                // Lanza excepción si no hay stock suficiente (Requisito 7 y 9)
                product.ReduceStock(item.Quantity);
                _productRepository.Update(product);

                // 4. Agregar detalle a la orden (Valida automáticamente duplicados Req 3 y calcula totales Req 4)
                salesOrder.AddDetail(product.Id, item.Quantity, product.UnitPrice);
            }

            // 5. Guardar la orden de venta principal
            _orderRepository.Add(salesOrder);

            // Persistir cambios en la base de datos
            _context.SaveChanges();

            // Confirmar transacción exitosa
            transaction.Commit();

            return Ok(new
            {
                message = "Order created successfully!",
                orderId = salesOrder.Id,
                subtotal = salesOrder.Subtotal,
                vat = salesOrder.VatAmount,
                total = salesOrder.TotalAmount
            });
        }
        catch (Exception ex)
        {
            // Si algo falla, revertimos toda la base de datos para no dejar datos corruptos
            transaction.Rollback();
            return BadRequest(new { error = ex.Message });
        }
    }
}