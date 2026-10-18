using Microsoft.EntityFrameworkCore;
using PosSystem.Domain.Interfaces;
using PosSystem.Infrastructure.Data;
using PosSystem.Infrastructure.Data;

namespace PosSystem.Infrastructure.Repositories;

public class Repository<T> : IRepository<T> where T : class
{
    protected readonly AppDbContext _context;
    protected readonly DbSet<T> _dbSet;

    public Repository(AppDbContext context)
    {
        _context = context;
        _dbSet = _context.Set<T>();
    }

    public T GetById(Guid id)
    {
        return _dbSet.Find(id);
    }

    public IEnumerable<T> GetAll()
    {
        return _dbSet.ToList();
    }

    public void Add(T entity)
    {
        _dbSet.Add(entity);
    }

    public void Update(T entity)
    {
        _dbSet.Update(entity);
    }

    public void Delete(T entity)
    {
        _dbSet.Remove(entity);
    }
}