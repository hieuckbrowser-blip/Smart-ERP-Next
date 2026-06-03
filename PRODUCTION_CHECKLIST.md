# Smart ERP Next — Production Readiness Checklist

## 🔢 Canonical Forecast Contract
- Không phải app tách `apps/ai-forecast`.
- Forecast centroid: `apps/api/src/forecast/forecast.service.ts` + `forecast.controller.ts`.
- Wrap by: `forecast monthly/daily`, khác với `analytics/cashflow/predictive-analytics`.

## ✅ Pre-Deployment Checklist

### Infrastructure
- [ ] **Server Requirements Met**
  - CPU: 2+ cores (4+ recommended)
  - RAM: 4GB minimum (8GB recommended)
  - Storage: 20GB+ free space
  - OS: Ubuntu 20.04+, CentOS 8+, or Windows Server 2019+

- [ ] **Docker & Dependencies**
  - Docker 20.10+ installed
  - Docker Compose 1.29+ installed
  - User added to docker group

- [ ] **Network Configuration**
  - Firewall ports open: 80, 443, 3000, 3001, 5432
  - Domain name configured (if applicable)
  - SSL certificates obtained (Let's Encrypt)

### Security
- [ ] **Environment Variables**
  - `.env.production` created with secure values
  - Database password: Strong, unique password
  - JWT secret: 32+ character random string
  - CORS origins: Restricted to specific domains

- [ ] **Access Control**
  - SSH key authentication enabled
  - Root login disabled
  - Fail2ban configured (optional)

- [ ] **Database Security**
  - Default PostgreSQL password changed
  - Database user with limited privileges
  - Regular backup schedule configured

## 🚀 Deployment Checklist

### Initial Setup
- [ ] **Repository Cloned**
  ```bash
  git clone https://github.com/smart-erp/smart-erp-next.git
  cd smart-erp-next
  ```

- [ ] **Environment Configured**
  ```bash
  cp .env.production.example .env.production
  nano .env.production  # Edit with your values
  ```

- [ ] **First Deployment**
  ```bash
  chmod +x scripts/deploy-production.sh
  ./scripts/deploy-production.sh production
  ```

### Service Verification
- [ ] **All Services Running**
  ```bash
  docker-compose -f docker-compose.production.yml ps
  ```
  - ✅ PostgreSQL: Healthy
  - ✅ API Server: Healthy  
  - ✅ Web Dashboard: Healthy
  - ✅ AI Forecast: Healthy

- [ ] **Health Checks Passing**
  ```bash
  ./scripts/monitor-health.sh
  ```
  - All services respond to health checks
  - Response times < 2 seconds
  - System resources within limits

- [ ] **Access Verification**
  - Web Dashboard: `http://your-domain:3001` loads
  - API Documentation: `http://your-domain:3000/api` accessible
  - SSL working (if configured)

## 🔧 Post-Deployment Configuration

### User Management
- [ ] **Admin Account Created**
  - Default admin: `admin@demo.com` / `Admin@123456`
  - Or custom admin created via setup wizard

- [ ] **User Roles Configured**
  - Admin: Full system access
  - Manager: Department-level access
  - Staff: Limited access based on role

### Business Configuration
- [ ] **Company Settings**
  - Company name, logo, contact information
  - Tax settings (VAT/GST rates)
  - Currency and localization settings

- [ ] **Initial Data**
  - Product categories created
  - Customer groups defined
  - Supplier information added
  - Warehouse locations configured

## 📊 Monitoring & Maintenance

### Regular Monitoring
- [ ] **Daily Checks**
  - Service health: `./scripts/monitor-health.sh`
  - Disk space: > 20% free
  - Error logs: No critical errors
  - Backup success: Last backup completed

- [ ] **Weekly Tasks**
  - Review application logs
  - Check security updates
  - Verify backup integrity
  - Monitor performance metrics

- [ ] **Monthly Maintenance**
  - Update dependencies: `pnpm update`
  - Security audit: `npm audit`
  - Database optimization: `VACUUM ANALYZE`
  - Review access logs

### Alerting Configuration
- [ ] **Basic Alerts** (Optional)
  - Service down notifications
  - High resource usage alerts
  - Security event monitoring
  - Backup failure alerts

## 🛡️ Security Hardening

### Application Security
- [ ] **Dependencies**
  - Regular security updates applied
  - No known vulnerabilities (npm audit clean)
  - Dependency locking enabled

- [ ] **API Security**
  - Rate limiting enabled
  - Input validation working
  - SQL injection prevention
  - XSS protection headers

### Infrastructure Security
- [ ] **Network**
  - Unnecessary ports closed
  - SSH secured with keys
  - Firewall rules reviewed

- [ ] **Data Protection**
  - Database encrypted at rest
  - Backups encrypted
  - Sensitive data masked in logs

## 📈 Performance Optimization

### Database Optimization
- [ ] **Indexes**
  - Frequently queried columns indexed
  - Composite indexes for common queries
  - Regular index maintenance

- [ ] **Query Optimization**
  - Slow queries identified and optimized
  - Connection pooling configured
  - Query caching enabled

### Application Performance
- [ ] **Caching**
  - Redis configured for session storage
  - API response caching where appropriate
  - Static asset caching

- [ ] **Resource Management**
  - Memory limits configured for containers
  - CPU limits set appropriately
  - Auto-scaling considered (if needed)

## 🔄 Update Procedures

### Minor Updates
```bash
# 1. Backup current deployment
./scripts/deploy-production.sh backup

# 2. Pull latest changes
git pull origin main

# 3. Deploy updates
./scripts/deploy-production.sh production

# 4. Verify deployment
./scripts/monitor-health.sh
```

### Major Updates
1. **Staging Deployment**: Test in staging first
2. **Data Migration**: Plan and test data migrations
3. **Rollback Plan**: Have rollback procedure ready
4. **Communication**: Notify users of maintenance window

## 🆘 Emergency Procedures

### Service Recovery
- **API Down**: `docker-compose -f docker-compose.production.yml restart api`
- **Database Issues**: Restore from latest backup
- **Web Dashboard Down**: Check NGINX/port configuration

### Data Recovery
```bash
# 1. Stop services
docker-compose -f docker-compose.production.yml down

# 2. Restore database
docker-compose -f docker-compose.production.yml exec -T postgres psql -U smart_erp_prod -d smart_erp < backup_file.sql

# 3. Restart services
docker-compose -f docker-compose.production.yml up -d
```

### Contact Information
- **System Admin**: [Your Contact]
- **Development Team**: [Team Contact]
- **Emergency Support**: [24/7 Contact]

## 📚 Documentation

### Essential Documents
- [x] `PRODUCTION_CHECKLIST.md` - This checklist
- [x] `docs/production-setup-guide.md` - Setup guide
- [x] `docs/beta-testing-guide.md` - User guide
- [x] `scripts/deploy-production.sh` - Deployment script
- [x] `scripts/monitor-health.sh` - Monitoring script

### Runbook Locations
- Deployment: `scripts/`
- Configuration: `.env.production`
- Logs: `docker-compose -f docker-compose.production.yml logs`
- Backups: `backups/` directory

---

**Last Verified**: 2026-05-17  
**Next Review Due**: 2026-06-17  
**System Version**: Smart ERP Next v0.4.0

---

> **Important**: This checklist should be reviewed and updated regularly as the system evolves. All team members should be familiar with these procedures.