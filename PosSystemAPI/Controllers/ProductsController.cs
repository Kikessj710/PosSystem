using Microsoft.AspNetCore.Mvc;
using PosSystem.Domain.Entities;
using PosSystem.Domain.Interfaces;

namespace PosSystem.API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class ProductsController : ControllerBase
{
    private readonly IRepository<Product> _productRepository;

    // Inyectamos el repositorio genérico que creamos en el dominio
    public ProductsController(IRepository<Product> productRepository)
    {
        _productRepository = productRepository;
    }

    // Servicio REST GET: Devuelve SOLO los productos con stock > 0 (Requisito 8)
    [HttpGet("available")]
    public IActionResult GetAvailableProducts()
    {
        var products = _productRepository.GetAll()
            .Where(p => p.IsActive && p.Stock > 0)
            .ToList();

        return Ok(products); // Devuelve la lista en formato JSON para el Front-End
    }
}