# Backend Core App

This `core` app contains the **global/shared functionality** of the Talent‑in‑School Management System. It is the foundation for the rest of the backend and should include:

## 1. Purpose
- Centralised models that are used across multiple domains (e.g., `School`, `User`, `Parent`).
- Common utilities, mixins, and permissions that other apps can import.
- Admin configuration that groups these shared models under a clear "Core" section.

## 2. Recommended Contents
| File / Directory | Description |
|-------------------|-------------|
| `models.py` | Houses the shared models: `School`, `User` (custom user extending `AbstractUser` if needed), `Parent`. |
| `admin.py` | Registers the core models with the Django admin and customizes list displays. |
| `apps.py` | Standard Django app config (`CoreConfig`). |
| `serializers.py` *(optional)* | DRF serializers for core models if you expose them via an API later. |
| `permissions.py` *(optional)* | Custom permission classes used by other apps. |
| `utils/` | Helper functions, constants, and reusable mixins. |
| `tests/` | Unit tests for core models and utilities. |

## 3. Development Checklist
1. **Create the app**
   ```bash
   python manage.py startapp core
   ```
2. **Add to `INSTALLED_APPS`** in `backend/config/settings.py`:
   ```python
   INSTALLED_APPS += ["core"]
   ```
3. **Define models** in `core/models.py` matching the tables from `schema.sql` that are shared globally (`School`, `User`, `Parent`).
4. **Run migrations**:
   ```bash
   python manage.py makemigrations core
   python manage.py migrate
   ```
5. **Register models in `admin.py`** to make them visible in the admin panel under the *Core* heading.
6. **Write unit tests** in `core/tests/` and run them with `python manage.py test core`.

## 4. Interaction with Other Apps
- Other apps (`students`, `results`, etc.) will import the core models directly, e.g.:
  ```python
  from core.models import School, User
  ```
- Keep foreign‑key relationships pointing to the core models to maintain a single source of truth.
## 5. Geographic Hierarchy

The geographic entities (Country, Zone, Region, District, Ward) are part of the **core** app because they are referenced by many other apps (students, results, announcements, etc.). Keeping them here provides a single source of truth.

### Models
- `Country` – name and ISO code.
- `Zone` – belongs to a `Country`.
- `Region` – belongs to a `Zone`.
- `District` – belongs to a `Region`.
- `Ward` – belongs to a `District`.

These models should be defined in `core/models.py` and registered in `core/admin.py`. Other apps can then use foreign keys like `ForeignKey(Ward, ...)` to link data to locations.


---

*This README serves as a living guide. Update it as the core app evolves.*
