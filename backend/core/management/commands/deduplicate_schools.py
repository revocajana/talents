from django.core.management.base import BaseCommand
from django.db import transaction
from core.models import School
from students.models import Student


class Command(BaseCommand):
    help = "Deduplicate and consolidate School records by registry_number. Migrates all students to the canonical school."

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be done without making changes',
        )

    @transaction.atomic
    def handle(self, *args, **options):
        dry_run = options.get('dry_run', False)
        
        # Find all schools grouped by registry_number
        schools_by_registry = {}
        for school in School.objects.all():
            reg_no = school.registry_number
            if reg_no not in schools_by_registry:
                schools_by_registry[reg_no] = []
            schools_by_registry[reg_no].append(school)
        
        # Identify duplicates
        duplicates = {reg: schools for reg, schools in schools_by_registry.items() if len(schools) > 1}
        
        if not duplicates:
            self.stdout.write(self.style.SUCCESS('No duplicate schools found.'))
            return
        
        self.stdout.write(self.style.WARNING(f'Found {len(duplicates)} registry numbers with duplicates:'))
        
        total_students_migrated = 0
        total_schools_deleted = 0
        
        for registry_number, schools in duplicates.items():
            self.stdout.write(f'\n  Registry {registry_number}:')
            
            # Keep the first (oldest) school as canonical
            canonical = schools[0]
            duplicates_to_merge = schools[1:]
            
            self.stdout.write(f'    Canonical: ID={canonical.id} ({canonical.name})')
            
            for duplicate in duplicates_to_merge:
                self.stdout.write(f'    Merging: ID={duplicate.id} ({duplicate.name})')
                
                # Migrate all students to the canonical school
                student_count = Student.objects.filter(school=duplicate).count()
                if student_count > 0:
                    self.stdout.write(f'      Migrating {student_count} students...')
                    if not dry_run:
                        Student.objects.filter(school=duplicate).update(school=canonical)
                    total_students_migrated += student_count
                
                # Delete the duplicate school
                self.stdout.write(f'      Deleting duplicate school...')
                if not dry_run:
                    duplicate.delete()
                total_schools_deleted += 1
        
        self.stdout.write('\n' + self.style.SUCCESS(f'Summary:'))
        self.stdout.write(f'  Students migrated: {total_students_migrated}')
        self.stdout.write(f'  Schools deleted: {total_schools_deleted}')
        
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN: No changes made. Run without --dry-run to apply.'))
        else:
            self.stdout.write(self.style.SUCCESS('Deduplication complete!'))
