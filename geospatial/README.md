# Urban Referral Network

## Overview

Urban Referral Network is a comprehensive contractor referral and call center management system designed to connect customers with qualified service contractors in their local area. The platform serves as a centralized hub for managing contractor networks, processing customer referrals, and facilitating efficient call center operations.

## Project Architecture

### Technology Stack

- **Backend Framework**: ASP.NET Core 8.0
- **Database**: Microsoft SQL Server with Entity Framework Core 9.0
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **API Documentation**: Swagger/OpenAPI
- **Database Migration**: Entity Framework Code-First Migrations

### System Components

#### Core Services
- **Geospatial Service**: Handles location-based contractor matching and distance calculations
- **Address Service**: Provides address validation and ZIP code management
- **Street Address Service**: Manages detailed address information
- **Service Area Map Service**: Defines and manages contractor service territories

#### Database Entities
- **Contractors**: Company information, service capabilities, and geographical coverage
- **Referrals**: Customer requests for services and contractor assignments
- **ZipCodes**: Geographic location data with coordinates
- **Service Types**: Categorized service offerings
- **Agents**: Call center staff management
- **Call Records**: Complete call history and interaction tracking

## Features

### Customer-Facing Features
- **Contractor Search**: Location-based contractor discovery using ZIP codes
- **Service Matching**: Intelligent matching based on service type and proximity
- **Referral Management**: Complete lifecycle tracking from request to completion
- **Address Validation**: Real-time ZIP code and address verification

### Call Center Management
- **Real-time Dashboard**: Live statistics and performance metrics
- **Call Queue Management**: Prioritized customer call handling
- **Agent Status Tracking**: Monitor agent availability and performance
- **Transfer Management**: Seamless call routing between agents
- **Customer Interaction Logging**: Complete interaction history

### Administrative Features
- **Contractor Registration**: Streamlined onboarding process for new contractors
- **Service Area Configuration**: Define contractor coverage areas
- **User Management**: Role-based access control for different user types
- **Reporting System**: Comprehensive analytics and performance reports
- **Audit Logging**: Complete system activity tracking

### Contractor Portal
- **Profile Management**: Update company information and service offerings
- **Referral Tracking**: View and manage assigned customer referrals
- **Performance Analytics**: Access to referral statistics and ratings

## API Endpoints

### Referral Management
- `POST /api/Referral/find-contractors` - Search for contractors by location and service type
- `POST /api/Referral/create-referral` - Create new customer referral
- `GET /api/Referral/all` - Retrieve all referrals with filtering options
- `GET /api/Referral/{id}` - Get specific referral details
- `PUT /api/Referral/{id}` - Update referral information
- `DELETE /api/Referral/{id}` - Remove referral from system

### Contractor Management
- `GET /api/Contractor` - List all contractors
- `PUT /api/Contractor/{id}` - Update contractor information
- `PUT /api/Contractor/{id}/toggle-status` - Activate/suspend contractor
- `DELETE /api/Contractor/{id}` - Remove contractor
- `POST /api/Contractor/register` - Register new contractor

### Call Center Operations
- `GET /api/CallCenter/queue/status` - Current call queue status
- `GET /api/CallCenter/reports/dashboard` - Real-time dashboard metrics
- `GET /api/CallCenter/agents/status` - Agent availability status
- `POST /api/CallCenter/transfers/{id}/accept` - Accept call transfer
- `POST /api/CallCenter/transfers/{id}/reject` - Reject call transfer

### System Administration
- `GET /api/Agent` - Manage system agents
- `POST /api/Auth/register-agent` - Register new system users
- `GET /api/ZipCode/{zipCode}` - ZIP code information and validation

## Installation and Setup

### Prerequisites
- .NET 8.0 SDK or later
- SQL Server (Local or Remote)
- Visual Studio 2022 or VS Code

### Configuration

1. **Clone the repository**
```bash
git clone [repository-url]
cd UrbanReferralNetwork
```

2. **Configure Database Connection**
Update `appsettings.json` with your SQL Server connection string:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=your-server;Database=UrbanReferralDB;Trusted_Connection=true;"
  }
}
```

3. **Run Database Migrations**
```bash
dotnet ef database update
```

4. **Seed Initial Data**
The application automatically seeds initial data including ZIP codes, service types, and sample contractors.

5. **Start the Application**
```bash
dotnet run
```

The application will be available at `http://localhost:5000`

## Project Structure

```
Backend/
├── Controllers/           # API Controllers
│   ├── ReferralController.cs
│   ├── ContractorController.cs
│   ├── CallCenterController.cs
│   └── ...
├── Data/                 # Database Context
│   └── UrbanReferralContext.cs
├── Models/               # Entity Models
│   ├── Contractor.cs
│   ├── Referral.cs
│   ├── Agent.cs
│   └── ...
├── Services/             # Business Logic
│   ├── GeospatialService.cs
│   ├── AddressService.cs
│   └── ...
├── Migrations/           # Database Migrations
├── wwwroot/             # Static Web Assets
│   ├── pages/           # HTML Pages
│   ├── css/            # Stylesheets
│   └── js/             # JavaScript Files
└── Program.cs           # Application Entry Point
```

## User Roles and Access

### System Administrator
- Full system access and configuration
- User management and role assignment
- System monitoring and maintenance
- Report generation and analytics

### Call Center Manager
- Call center operations oversight
- Agent management and scheduling
- Performance monitoring
- Customer interaction review

### Call Center Agent
- Customer call handling
- Referral creation and management
- Contractor communication
- Basic reporting access

### Contractor
- Profile and service management
- Referral viewing and response
- Performance tracking
- Customer communication

## Key Workflows

### Customer Referral Process
1. Customer contacts call center or uses web interface
2. Agent captures customer requirements and location
3. System searches for qualified contractors within service area
4. Top 3 contractors are presented based on proximity and ratings
5. Referral is created and distributed to selected contractors
6. Contractors respond with availability and estimates
7. Customer selects preferred contractor
8. Work completion is tracked and recorded

### Contractor Onboarding
1. Contractor submits registration application
2. System validates licensing and insurance information
3. Service areas and capabilities are defined
4. Profile is reviewed and approved by administration
5. Contractor gains access to referral system
6. Performance tracking begins

### Call Center Operations
1. Incoming calls are queued and prioritized
2. Available agents receive call assignments
3. Customer information is captured and validated
4. Service requirements are documented
5. Contractor search and referral creation
6. Follow-up scheduling and tracking
7. Case resolution and documentation

## Performance and Scalability

The system is designed to handle high-volume operations with:
- Efficient database indexing for fast contractor searches
- Geospatial calculations optimized for large datasets
- Asynchronous processing for non-blocking operations
- Comprehensive caching strategies
- Scalable API architecture

## Security Features

- Role-based access control (RBAC)
- Secure API endpoints with authentication
- Data validation and sanitization
- Audit logging for sensitive operations
- SQL injection protection through Entity Framework

## Monitoring and Logging

- Comprehensive application logging
- Performance metrics tracking
- Error handling and reporting
- User activity monitoring
- System health checks

## Development Guidelines

### Code Standards
- Follow C# naming conventions
- Implement proper error handling
- Use dependency injection patterns
- Maintain comprehensive documentation
- Write unit tests for critical functionality

### Database Management
- Use Entity Framework migrations for schema changes
- Follow Code-First development approach
- Implement proper indexing strategies
- Maintain data integrity constraints

## Support and Maintenance

For technical support, system administration, or development questions, please refer to the system documentation or contact the development team.

## License

This project is proprietary software developed for Urban Referral Network operations.