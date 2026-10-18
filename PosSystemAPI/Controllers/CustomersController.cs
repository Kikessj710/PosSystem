using Microsoft.AspNetCore.Mvc;
using PosSystem.Domain.Entities;
using PosSystem.Domain.Interfaces;

namespace PosSystem.API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class CustomersController : ControllerBase
{
    private readonly IRepository<Customer> _customerRepository;

    public CustomersController(IRepository<Customer> customerRepository)
    : base()
    {
        _customerRepository = customerRepository;
    }

    [HttpGet]
    public IActionResult GetCustomers()
    {
        var customers = _customerRepository.GetAll();
        return Ok(customers);
    }
}