import os
import sys

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
BACKEND_DIR = os.path.join(PROJECT_ROOT, 'backend')
if PROJECT_ROOT not in sys.path:
	sys.path.append(PROJECT_ROOT)
if BACKEND_DIR not in sys.path:
	sys.path.append(BACKEND_DIR)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.config.settings')

import django

django.setup()

from django.db import transaction

from core.models import Country, CountryClub # type: ignore

CLUBS = [
	('Rumanyika Club', 'Singing, instrumental music, band, choir'),
	('Ibanda Club', 'Ballet, hip-hop, contemporary, traditional dance'),
	('Serengeti Club', 'Acting, directing, playwriting, stagecraft'),
	('Burigi Club', 'Football, basketball, track and field, gymnastics'),
	('Mikumi Club', 'Drawing, painting, digital art, sculpture'),
	('Mtagata Club', 'Cooking, baking, food decoration'),
	('Ngorongoro Club', 'Writing, public speaking, debate'),
	('Saanane Club', 'Robotics, coding, environmental science, innovation'),
	('Rubondo Club', 'Photography, videography, media production'),
	('Gombe Club', 'Community service, charity, and volunteering'),
]

SAMPLE_CLUBS = [
	('Kilimanjaro Club', 'Singing, instrumental music, band, choir'),
	('Zanzibar Club', 'Ballet, hip-hop, contemporary, traditional dance'),
	('Ruaha Club', 'Acting, directing, playwriting, stagecraft'),
	('Mafia Club', 'Football, basketball, track and field, gymnastics'),
	('Usambara Club', 'Drawing, painting, digital art, sculpture'),
	('Pemba Club', 'Cooking, baking, food decoration'),
	('Manyara Club', 'Writing, public speaking, debate'),
	('Kitulo Club', 'Robotics, coding, environmental science, innovation'),
	('Saadani Club', 'Photography, videography, media production'),
	('Udzungwa Club', 'Community service, charity, and volunteering'),
]


def clubs_for_country(country):
	if country.code.upper() == 'SMP' or country.name.lower().startswith('sample'):
		return SAMPLE_CLUBS
	return CLUBS


def populate_clubs():
	countries = Country.objects.all().order_by('id')
	clubs_created = 0
	for country in countries:
		club_definitions = clubs_for_country(country)
		if club_definitions is SAMPLE_CLUBS:
			for (old_name, _), (name, focus) in zip(CLUBS, club_definitions):
				old_club = CountryClub.objects.filter(country=country, name=old_name).first()
				if old_club:
					old_club.name = name
					old_club.focus = focus
					old_club.save(update_fields=['name', 'focus'])
					continue
				_, was_created = CountryClub.objects.update_or_create(
					country=country,
					name=name,
					defaults={'focus': focus},
				)
				clubs_created += int(was_created)
		else:
			for name, focus in club_definitions:
				_, was_created = CountryClub.objects.update_or_create(
					country=country,
					name=name,
					defaults={'focus': focus},
				)
				clubs_created += int(was_created)

	print('--- Club and related data populated ---')
	print(f'Countries processed: {countries.count()}')
	print(f'Country clubs created: {clubs_created}')


if __name__ == '__main__':
	populate_clubs()
