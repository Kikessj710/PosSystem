namespace PosSystem.Domain.Entities;

public class Customer
{
    public Guid Id { get; private set; }
    public string IdentificationCard { get; private set; }
    public string FullName { get; private set; }
    public string Email { get; private set; }

    public Customer(string identificationCard, string fullName, string email)
    {
        Id = Guid.NewGuid();
        IdentificationCard = identificationCard;
        FullName = fullName;
        Email = email;
    }
}