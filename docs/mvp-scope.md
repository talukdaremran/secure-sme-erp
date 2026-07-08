# MVP Scope

## Goal

Build a secure web-based ERP system for small and medium-sized businesses.

The first version will focus on a simple but working ERP core before adding AI and analytics features.

## Version 1 - Core ERP

- User registration and login
- Role-based access control
- Product management
- Customer management
- Sales order creation
- Invoice generation
- Payment status tracking without real payment gateway integration
- Audit logs
- Basic dashboard

## Version 2 - AI and Analytics

- Fraud or anomaly detection
- Sales forecasting
- Customer churn prediction

## Out of Scope for Version 1

- Real payment gateway integration
- Real email/SMS marketing
- Mobile application
- Multi-language support
- Microservices
- Advanced deep learning

## Development Workflow

The project will be developed one feature at a time.

For each feature:

1. Create a GitHub Issue
2. Create a feature branch from `dev`
3. Implement the feature
4. Test the feature
5. Commit changes with a meaningful message
6. Open a Pull Request into `dev`
7. Merge after review
8. Keep `main` stable for completed versions