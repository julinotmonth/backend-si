# SI-DIROK Backend API

Backend API for **SI-DIROK** - Sistem Informasi Diagnosis Penyakit Akibat Rokok (Smoking-Related Disease Diagnosis Information System).

## Tech Stack

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs

## Features

- 🔐 User authentication (register, login, profile)
- 🏥 Expert system diagnosis using **Certainty Factor** method
- 📚 Educational content management
- 👨‍💼 Admin dashboard and management
- 📧 Contact form

## Database Schema

### Tables
- `users` - User accounts and profiles
- `symptoms` - 33 smoking-related symptoms
- `diseases` - 8 smoking-related diseases
- `rules` - 56 Certainty Factor rules linking symptoms to diseases
- `diagnoses` - Consultation history
- `education` - Educational articles
- `contact_messages` - Contact form submissions
- `disease_symptoms` - Many-to-many relationship table

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+

### Installation

1. **Clone and install dependencies**
   ```bash
   cd backend-sidirokk-main
   npm install
   ```

2. **Configure PostgreSQL database**
   
   Create a new database:
   ```sql
   CREATE DATABASE sidirok_db;
   ```

3. **Configure environment variables**
   
   Copy `.env.example` to `.env` and update:
   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # JWT Configuration
   JWT_SECRET=your-secure-secret-key
   JWT_EXPIRES_IN=7d

   # PostgreSQL Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=sidirok_db
   DB_USER=postgres
   DB_PASSWORD=your_password

   # OR use DATABASE_URL for cloud deployment
   # DATABASE_URL=postgresql://username:password@host:port/database

   # Frontend URL (for CORS)
   FRONTEND_URL=http://localhost:5173
   ```

4. **Run database migration**
   ```bash
   npm run migrate
   ```

5. **Seed initial data**
   ```bash
   npm run seed
   ```

6. **Start the server**
   ```bash
   # Development (with auto-reload)
   npm run dev

   # Production
   npm start
   ```

### Default Users

After seeding, you can login with:

| Role  | Email              | Password  |
|-------|-------------------|-----------|
| Admin | admin@sidirok.com | admin123  |
| User  | user@test.com     | user123   |

## API Endpoints

### Authentication
| Method | Endpoint                | Description          |
|--------|------------------------|----------------------|
| POST   | /api/auth/register     | Register new user    |
| POST   | /api/auth/login        | Login user           |
| GET    | /api/auth/me           | Get current profile  |
| PUT    | /api/auth/profile      | Update profile       |
| PUT    | /api/auth/password     | Change password      |

### Symptoms
| Method | Endpoint                | Description          |
|--------|------------------------|----------------------|
| GET    | /api/symptoms          | Get all symptoms     |
| GET    | /api/symptoms/:id      | Get symptom by ID    |
| GET    | /api/symptoms/categories | Get categories     |
| POST   | /api/symptoms          | Create symptom (admin) |
| PUT    | /api/symptoms/:id      | Update symptom (admin) |
| DELETE | /api/symptoms/:id      | Delete symptom (admin) |

### Diseases
| Method | Endpoint                | Description          |
|--------|------------------------|----------------------|
| GET    | /api/diseases          | Get all diseases     |
| GET    | /api/diseases/:id      | Get disease by ID    |
| POST   | /api/diseases          | Create disease (admin) |
| PUT    | /api/diseases/:id      | Update disease (admin) |
| DELETE | /api/diseases/:id      | Delete disease (admin) |

### Rules
| Method | Endpoint                | Description          |
|--------|------------------------|----------------------|
| GET    | /api/rules             | Get all rules        |
| GET    | /api/rules/:id         | Get rule by ID       |
| POST   | /api/rules             | Create rule (admin)  |
| PUT    | /api/rules/:id         | Update rule (admin)  |
| DELETE | /api/rules/:id         | Delete rule (admin)  |

### Diagnosis
| Method | Endpoint                | Description          |
|--------|------------------------|----------------------|
| POST   | /api/diagnosis         | Process diagnosis    |
| GET    | /api/diagnosis/history | Get user's history   |
| GET    | /api/diagnosis/:id     | Get diagnosis by ID  |
| DELETE | /api/diagnosis/:id     | Delete diagnosis     |

### Education
| Method | Endpoint                | Description          |
|--------|------------------------|----------------------|
| GET    | /api/education         | Get all articles     |
| GET    | /api/education/:id     | Get article          |
| POST   | /api/education         | Create article (admin) |
| PUT    | /api/education/:id     | Update article (admin) |
| DELETE | /api/education/:id     | Delete article (admin) |

### Contact
| Method | Endpoint                | Description          |
|--------|------------------------|----------------------|
| POST   | /api/contact           | Submit contact form  |

### Admin
| Method | Endpoint                        | Description              |
|--------|--------------------------------|--------------------------|
| GET    | /api/admin/dashboard           | Get dashboard stats      |
| GET    | /api/admin/users               | Get all users            |
| PUT    | /api/admin/users/:id/role      | Update user role         |
| DELETE | /api/admin/users/:id           | Delete user              |
| GET    | /api/admin/messages            | Get contact messages     |
| PUT    | /api/admin/messages/:id/read   | Mark message as read     |
| DELETE | /api/admin/messages/:id        | Delete message           |
| GET    | /api/admin/diagnoses           | Get all diagnoses        |

## Scripts

```bash
npm start          # Start production server
npm run dev        # Start development server with auto-reload
npm run migrate    # Run database migrations
npm run seed       # Seed database with initial data
npm run migrate:down  # Drop all tables (WARNING: deletes all data)
```

## Certainty Factor Algorithm

The diagnosis uses the **Certainty Factor (CF)** method:

```
CF = MB - MD
CF_user = CF × User_Certainty

Combination Rules:
- If CF1 ≥ 0 and CF2 ≥ 0: CF_combine = CF1 + CF2 × (1 - CF1)
- If CF1 < 0 and CF2 < 0: CF_combine = CF1 + CF2 × (1 + CF1)
- If different signs: CF_combine = (CF1 + CF2) / (1 - min(|CF1|, |CF2|))
```

## Deployment

### Using Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Cloud Platforms

For platforms like Railway, Render, or Heroku:

1. Set `DATABASE_URL` environment variable
2. Set `NODE_ENV=production`
3. Set `JWT_SECRET` with a secure random string
4. Run `npm run migrate && npm run seed` as release command

## License

ISC


Backend REST API untuk **SI-DIROK** (Sistem Informasi Diagnosis Penyakit Akibat Rokok) menggunakan Node.js, Express, dan SQLite.

## 🚀 Fitur

- **Autentikasi JWT** - Register, Login, Profile management
- **Sistem Pakar Certainty Factor** - Diagnosis penyakit berdasarkan gejala
- **CRUD Operations** - Kelola gejala, penyakit, rules, dan konten edukasi
- **Admin Dashboard** - Statistik dan manajemen user
- **History Tracking** - Riwayat diagnosis untuk setiap user

## 📋 Prasyarat

- Node.js >= 18.x
- npm atau yarn

## 🛠️ Instalasi

1. **Clone atau extract project**

2. **Install dependencies**
   ```bash
   cd si-dirok-backend
   npm install
   ```

3. **Jalankan migrasi database**
   ```bash
   npm run migrate
   ```

4. **Seed data awal**
   ```bash
   npm run seed
   ```

5. **Jalankan server**
   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

## 📁 Struktur Project

```
si-dirok-backend/
├── src/
│   ├── config/
│   │   ├── database.js      # Koneksi SQLite
│   │   ├── migrate.js       # Script migrasi
│   │   └── seed.js          # Script seeding
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── symptomsController.js
│   │   ├── diseasesController.js
│   │   ├── rulesController.js
│   │   ├── diagnosisController.js
│   │   ├── educationController.js
│   │   ├── adminController.js
│   │   └── contactController.js
│   ├── middleware/
│   │   ├── auth.js          # JWT authentication
│   │   └── errorHandler.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── symptoms.js
│   │   ├── diseases.js
│   │   ├── rules.js
│   │   ├── diagnosis.js
│   │   ├── education.js
│   │   ├── admin.js
│   │   ├── contact.js
│   │   └── index.js
│   ├── utils/
│   │   ├── certaintyFactor.js  # Algoritma CF
│   │   └── helpers.js
│   └── index.js             # Entry point
├── .env
├── package.json
└── README.md
```

## 🔑 API Endpoints

### Authentication
| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| POST | `/api/auth/register` | Register user baru | - |
| POST | `/api/auth/login` | Login user | - |
| GET | `/api/auth/me` | Get profile | ✅ |
| PUT | `/api/auth/profile` | Update profile | ✅ |
| PUT | `/api/auth/password` | Ganti password | ✅ |

### Symptoms (Gejala)
| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| GET | `/api/symptoms` | Get semua gejala | - |
| GET | `/api/symptoms/categories` | Get kategori | - |
| GET | `/api/symptoms/:id` | Get gejala by ID | - |
| POST | `/api/symptoms` | Tambah gejala | Admin |
| PUT | `/api/symptoms/:id` | Update gejala | Admin |
| DELETE | `/api/symptoms/:id` | Hapus gejala | Admin |

### Diseases (Penyakit)
| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| GET | `/api/diseases` | Get semua penyakit | - |
| GET | `/api/diseases/:id` | Get penyakit by ID | - |
| POST | `/api/diseases` | Tambah penyakit | Admin |
| PUT | `/api/diseases/:id` | Update penyakit | Admin |
| DELETE | `/api/diseases/:id` | Hapus penyakit | Admin |

### Rules (Aturan CF)
| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| GET | `/api/rules` | Get semua rules | - |
| GET | `/api/rules/:id` | Get rule by ID | - |
| POST | `/api/rules` | Tambah rule | Admin |
| PUT | `/api/rules/:id` | Update rule | Admin |
| DELETE | `/api/rules/:id` | Hapus rule | Admin |

### Diagnosis
| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| POST | `/api/diagnosis` | Proses diagnosis | Optional |
| GET | `/api/diagnosis/history` | Get riwayat | ✅ |
| GET | `/api/diagnosis/history/:id` | Get diagnosis by ID | ✅ |
| DELETE | `/api/diagnosis/history/:id` | Hapus riwayat | ✅ |
| GET | `/api/diagnosis/statistics` | Get statistik | Admin |
| GET | `/api/diagnosis/all` | Get semua diagnosis | Admin |

### Education (Edukasi)
| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| GET | `/api/education` | Get semua artikel | - |
| GET | `/api/education/categories` | Get kategori | - |
| GET | `/api/education/:idOrSlug` | Get artikel | - |
| POST | `/api/education` | Tambah artikel | Admin |
| PUT | `/api/education/:id` | Update artikel | Admin |
| DELETE | `/api/education/:id` | Hapus artikel | Admin |

### Admin
| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| GET | `/api/admin/dashboard` | Get dashboard stats | Admin |
| GET | `/api/admin/users` | Get semua users | Admin |
| PUT | `/api/admin/users/:id/role` | Update role user | Admin |
| DELETE | `/api/admin/users/:id` | Hapus user | Admin |
| GET | `/api/admin/messages` | Get pesan kontak | Admin |

### Contact
| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| POST | `/api/contact` | Kirim pesan | - |

## 📊 Contoh Request

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@sidirok.com", "password": "admin123"}'
```

### Process Diagnosis
```bash
curl -X POST http://localhost:3000/api/diagnosis \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "userData": {
      "name": "John Doe",
      "age": 45,
      "gender": "male",
      "smokingYears": 20,
      "cigarettesPerDay": 15
    },
    "selectedSymptoms": [
      { "symptomId": "G01", "certainty": 0.8 },
      { "symptomId": "G03", "certainty": 0.6 },
      { "symptomId": "G06", "certainty": 0.9 }
    ]
  }'
```

## 🔐 Default Accounts

| Email | Password | Role |
|-------|----------|------|
| admin@sidirok.com | admin123 | Admin |
| user@test.com | user123 | User |

## 🧮 Algoritma Certainty Factor

Sistem ini menggunakan metode **Certainty Factor (CF)** untuk diagnosis:

```
CF = MB - MD

CF_combine(CF1, CF2):
  - Jika keduanya positif: CF1 + CF2 × (1 - CF1)
  - Jika keduanya negatif: CF1 + CF2 × (1 + CF1)
  - Jika berbeda tanda: (CF1 + CF2) / (1 - min(|CF1|, |CF2|))
```

**Faktor Risiko** dihitung berdasarkan:
- Usia
- Lama merokok (tahun)
- Jumlah rokok per hari
- Pack-years = (rokok/hari ÷ 20) × tahun merokok

## 📝 Environment Variables

```env
PORT=3000
NODE_ENV=development
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
DATABASE_PATH=./database.sqlite
FRONTEND_URL=http://localhost:5173
```

## 🗃️ Database Schema

### Tables
- **users** - Data pengguna
- **symptoms** - Data gejala (33 gejala)
- **diseases** - Data penyakit (8 penyakit)
- **disease_symptoms** - Relasi penyakit-gejala
- **rules** - Aturan CF (56 rules)
- **diagnoses** - Riwayat diagnosis
- **education** - Konten edukasi
- **contact_messages** - Pesan kontak

## 🤝 Integrasi dengan Frontend

Update file `src/services/api.js` di frontend:

```javascript
const API_BASE_URL = 'http://localhost:3000/api';

// Contoh fetch dengan auth
const fetchWithAuth = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  return fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      ...options.headers,
    },
  });
};
```

## 📄 License

MIT License
