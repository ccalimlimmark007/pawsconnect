<?php

namespace Database\Seeders;

use App\Enums\Role;
use App\Models\Pet;
use App\Models\PetImage;
use App\Models\Shelter;
use App\Models\ShelterContact;
use App\Models\User;
use Illuminate\Database\Seeder;

class PetSeeder extends Seeder
{
    public function run(): void
    {
        $staff = User::where('role', Role::ShelterStaff->value)->first()
            ?? User::where('role', Role::Admin->value)->first()
            ?? User::first();

        if (! $staff) {
            $this->command->error('No users found — run the main seeder first.');
            return;
        }

        // ── Shelter 1 ────────────────────────────────────────────────────────
        $shelter1 = Shelter::firstOrCreate(
            ['name' => 'Happy Paws Shelter'],
            ['created_by' => $staff->id]
        );

        ShelterContact::firstOrCreate(
            ['shelter_id' => $shelter1->id],
            [
                'created_by'            => $staff->id,
                'name'                  => 'Happy Paws Shelter',
                'phone'                 => '(555) 234-5678',
                'email'                 => 'adopt@happypaws.org',
                'address'               => '1234 Pawprint Lane, Portland, OR 97201',
                'hours'                 => 'Mon–Fri 8am–5pm, Sat 10am–3pm',
                'structured_hours'      => [
                    'monday'    => ['open' => '08:00', 'close' => '17:00'],
                    'tuesday'   => ['open' => '08:00', 'close' => '17:00'],
                    'wednesday' => ['open' => '08:00', 'close' => '17:00'],
                    'thursday'  => ['open' => '08:00', 'close' => '17:00'],
                    'friday'    => ['open' => '08:00', 'close' => '17:00'],
                    'saturday'  => ['open' => '10:00', 'close' => '15:00'],
                    'sunday'    => null,
                ],
                'slot_duration_minutes' => 60,
            ]
        );

        // ── Shelter 2 ────────────────────────────────────────────────────────
        $shelter2 = Shelter::firstOrCreate(
            ['name' => 'Furever Friends Rescue'],
            ['created_by' => $staff->id]
        );

        ShelterContact::firstOrCreate(
            ['shelter_id' => $shelter2->id],
            [
                'created_by'            => $staff->id,
                'name'                  => 'Furever Friends Rescue',
                'phone'                 => '(555) 876-5432',
                'email'                 => 'hello@fureverrescue.org',
                'address'               => '789 Whisker Way, Austin, TX 78701',
                'hours'                 => 'Tue–Sat 9am–4pm',
                'structured_hours'      => [
                    'monday'    => null,
                    'tuesday'   => ['open' => '09:00', 'close' => '16:00'],
                    'wednesday' => ['open' => '09:00', 'close' => '16:00'],
                    'thursday'  => ['open' => '09:00', 'close' => '16:00'],
                    'friday'    => ['open' => '09:00', 'close' => '16:00'],
                    'saturday'  => ['open' => '09:00', 'close' => '16:00'],
                    'sunday'    => null,
                ],
                'slot_duration_minutes' => 30,
            ]
        );

        // ── Shelter 3 ────────────────────────────────────────────────────────
        $shelter3 = Shelter::firstOrCreate(
            ['name' => 'Second Chances Animal Sanctuary'],
            ['created_by' => $staff->id]
        );

        ShelterContact::firstOrCreate(
            ['shelter_id' => $shelter3->id],
            [
                'created_by'            => $staff->id,
                'name'                  => 'Second Chances Animal Sanctuary',
                'phone'                 => '(555) 321-9876',
                'email'                 => 'care@secondchances.org',
                'address'               => '456 Meadow Drive, Denver, CO 80203',
                'hours'                 => 'Wed–Sun 10am–6pm',
                'structured_hours'      => [
                    'monday'    => null,
                    'tuesday'   => null,
                    'wednesday' => ['open' => '10:00', 'close' => '18:00'],
                    'thursday'  => ['open' => '10:00', 'close' => '18:00'],
                    'friday'    => ['open' => '10:00', 'close' => '18:00'],
                    'saturday'  => ['open' => '10:00', 'close' => '18:00'],
                    'sunday'    => ['open' => '10:00', 'close' => '18:00'],
                ],
                'slot_duration_minutes' => 45,
            ]
        );

        // ── Pets ─────────────────────────────────────────────────────────────
        $pets = [
            // ─ Original 5 ────────────────────────────────────────────────────
            [
                'shelter_id'          => $shelter1->id,
                'name'                => 'Buddy',
                'species'             => 'Dog',
                'breed'               => 'Golden Retriever',
                'age'                 => 3,
                'age_unit'            => 'years',
                'gender'              => 'Male',
                'size'                => 'Large',
                'color'               => 'Golden',
                'medical_status'      => 'Healthy',
                'is_vetted'           => true,
                'availability_status' => true,
                'adoption_fee'        => 250.00,
                'description'         => 'Buddy is a friendly, energetic Golden Retriever who loves fetch and cuddles. He is great with kids and very well-trained.',
                'temperament_tags'    => ['High Energy', 'Good with Kids', 'Playful', 'Trained'],
                'good_with'           => ['Children', 'Dogs'],
                'not_good_with'       => ['Cats'],
            ],
            [
                'shelter_id'          => $shelter1->id,
                'name'                => 'Luna',
                'species'             => 'Cat',
                'breed'               => 'Domestic Shorthair',
                'age'                 => 2,
                'age_unit'            => 'years',
                'gender'              => 'Female',
                'size'                => 'Small',
                'color'               => 'Grey',
                'medical_status'      => 'Healthy',
                'is_vetted'           => true,
                'availability_status' => true,
                'adoption_fee'        => 100.00,
                'description'         => 'Luna is a gentle and affectionate cat who loves lounging in sunny spots and kneading on warm laps.',
                'temperament_tags'    => ['Calm', 'Senior Friendly', 'First-Time Owner'],
                'good_with'           => ['Adults', 'Cats'],
                'not_good_with'       => ['Dogs'],
            ],
            [
                'shelter_id'          => $shelter1->id,
                'name'                => 'Max',
                'species'             => 'Dog',
                'breed'               => 'German Shepherd',
                'age'                 => 4,
                'age_unit'            => 'years',
                'gender'              => 'Male',
                'size'                => 'Large',
                'color'               => 'Black and Tan',
                'medical_status'      => 'Healthy',
                'is_vetted'           => true,
                'availability_status' => true,
                'adoption_fee'        => 300.00,
                'description'         => 'Max is a loyal, intelligent German Shepherd. He excels at obedience and is ideal for an active household.',
                'temperament_tags'    => ['Trained', 'High Energy'],
                'good_with'           => ['Children', 'Adults'],
                'not_good_with'       => ['Small Animals'],
            ],
            [
                'shelter_id'          => $shelter2->id,
                'name'                => 'Cleo',
                'species'             => 'Cat',
                'breed'               => 'Siamese',
                'age'                 => 5,
                'age_unit'            => 'years',
                'gender'              => 'Female',
                'size'                => 'Small',
                'color'               => 'Cream & Brown',
                'medical_status'      => 'Healthy',
                'is_vetted'           => true,
                'availability_status' => true,
                'adoption_fee'        => 120.00,
                'description'         => 'Cleo is a talkative Siamese with a bold personality. She loves to be the centre of attention and will charm everyone she meets.',
                'temperament_tags'    => ['Playful', 'Good with Pets'],
                'good_with'           => ['Adults', 'Cats'],
                'not_good_with'       => ['Dogs'],
            ],
            [
                'shelter_id'          => $shelter2->id,
                'name'                => 'Rocky',
                'species'             => 'Dog',
                'breed'               => 'Labrador Mix',
                'age'                 => 6,
                'age_unit'            => 'months',
                'gender'              => 'Male',
                'size'                => 'Medium',
                'color'               => 'Chocolate',
                'medical_status'      => 'Healthy',
                'is_vetted'           => true,
                'availability_status' => true,
                'adoption_fee'        => 200.00,
                'description'         => 'Rocky is a puppy full of curiosity and joy. He picks up commands quickly and loves exploring outdoors.',
                'temperament_tags'    => ['High Energy', 'Good with Kids', 'Playful'],
                'good_with'           => ['Children', 'Dogs', 'Cats'],
                'not_good_with'       => [],
            ],

            // ─ New: Dogs ─────────────────────────────────────────────────────
            [
                'shelter_id'          => $shelter1->id,
                'name'                => 'Daisy',
                'species'             => 'Dog',
                'breed'               => 'Cavalier King Charles Spaniel',
                'age'                 => 2,
                'age_unit'            => 'years',
                'gender'              => 'Female',
                'size'                => 'Small',
                'color'               => 'Chestnut & White',
                'medical_status'      => 'Healthy',
                'is_vetted'           => true,
                'availability_status' => true,
                'adoption_fee'        => 280.00,
                'description'         => 'Daisy is a sweet, gentle Cavalier who thrives on companionship. She loves lap time, slow walks, and being near her favourite people.',
                'temperament_tags'    => ['Calm', 'Good with Kids', 'Senior Friendly', 'First-Time Owner'],
                'good_with'           => ['Children', 'Adults', 'Dogs', 'Cats'],
                'not_good_with'       => [],
            ],
            [
                'shelter_id'          => $shelter3->id,
                'name'                => 'Charlie',
                'species'             => 'Dog',
                'breed'               => 'Beagle',
                'age'                 => 3,
                'age_unit'            => 'years',
                'gender'              => 'Male',
                'size'                => 'Medium',
                'color'               => 'Tricolor',
                'medical_status'      => 'Healthy',
                'is_vetted'           => true,
                'availability_status' => true,
                'adoption_fee'        => 220.00,
                'description'         => 'Charlie is a curious and merry Beagle who follows his nose everywhere. He loves hikes, nose-work games, and a good belly rub after a long adventure.',
                'temperament_tags'    => ['Playful', 'High Energy', 'Good with Kids'],
                'good_with'           => ['Children', 'Dogs'],
                'not_good_with'       => ['Cats', 'Small Animals'],
            ],
            [
                'shelter_id'          => $shelter2->id,
                'name'                => 'Nala',
                'species'             => 'Dog',
                'breed'               => 'Border Collie Mix',
                'age'                 => 1,
                'age_unit'            => 'years',
                'gender'              => 'Female',
                'size'                => 'Medium',
                'color'               => 'Black & White',
                'medical_status'      => 'Healthy',
                'is_vetted'           => true,
                'availability_status' => true,
                'adoption_fee'        => 230.00,
                'description'         => 'Nala is a highly intelligent young dog who learns tricks in minutes. She needs an active family who can keep her mentally and physically stimulated.',
                'temperament_tags'    => ['High Energy', 'Trained', 'Playful'],
                'good_with'           => ['Adults', 'Dogs'],
                'not_good_with'       => ['Small Animals'],
            ],

            // ─ New: Cats ─────────────────────────────────────────────────────
            [
                'shelter_id'          => $shelter3->id,
                'name'                => 'Oliver',
                'species'             => 'Cat',
                'breed'               => 'Maine Coon',
                'age'                 => 4,
                'age_unit'            => 'years',
                'gender'              => 'Male',
                'size'                => 'Large',
                'color'               => 'Brown Tabby',
                'medical_status'      => 'Healthy',
                'is_vetted'           => true,
                'availability_status' => true,
                'adoption_fee'        => 150.00,
                'description'         => 'Oliver is a majestic Maine Coon with a dog-like personality. He greets visitors at the door, walks on a leash, and loves a good play session with a wand toy.',
                'temperament_tags'    => ['Playful', 'Good with Pets', 'First-Time Owner'],
                'good_with'           => ['Adults', 'Cats', 'Dogs'],
                'not_good_with'       => [],
            ],
            [
                'shelter_id'          => $shelter1->id,
                'name'                => 'Bella',
                'species'             => 'Cat',
                'breed'               => 'Persian',
                'age'                 => 6,
                'age_unit'            => 'years',
                'gender'              => 'Female',
                'size'                => 'Medium',
                'color'               => 'White',
                'medical_status'      => 'Healthy',
                'is_vetted'           => true,
                'availability_status' => true,
                'adoption_fee'        => 130.00,
                'description'         => 'Bella is a regal Persian who adores quiet households. She\'s happiest curled on a soft cushion and enjoys gentle grooming sessions.',
                'temperament_tags'    => ['Calm', 'Senior Friendly'],
                'good_with'           => ['Adults'],
                'not_good_with'       => ['Dogs', 'Children'],
            ],

            // ─ New: Rabbits ───────────────────────────────────────────────────
            [
                'shelter_id'          => $shelter1->id,
                'name'                => 'Thumper',
                'species'             => 'Rabbit',
                'breed'               => 'Holland Lop',
                'age'                 => 1,
                'age_unit'            => 'years',
                'gender'              => 'Male',
                'size'                => 'Small',
                'color'               => 'Grey & White',
                'medical_status'      => 'Healthy',
                'is_vetted'           => true,
                'availability_status' => true,
                'adoption_fee'        => 80.00,
                'description'         => 'Thumper is a floppy-eared Holland Lop with the most irresistible personality. He loves to binky around his pen, explore cardboard tunnels, and snuggle in the evenings.',
                'temperament_tags'    => ['Playful', 'Good with Kids', 'First-Time Owner'],
                'good_with'           => ['Children', 'Adults', 'Rabbits'],
                'not_good_with'       => ['Dogs', 'Cats'],
            ],
            [
                'shelter_id'          => $shelter2->id,
                'name'                => 'Hazel',
                'species'             => 'Rabbit',
                'breed'               => 'Lionhead',
                'age'                 => 8,
                'age_unit'            => 'months',
                'gender'              => 'Female',
                'size'                => 'Small',
                'color'               => 'Golden Brown',
                'medical_status'      => 'Healthy',
                'is_vetted'           => true,
                'availability_status' => true,
                'adoption_fee'        => 70.00,
                'description'         => 'Hazel is a fluffy Lionhead with a mane to die for. She is curious and bold, loves fresh greens, and will stand on her hind legs whenever she hears the treat bag.',
                'temperament_tags'    => ['Playful', 'Calm', 'First-Time Owner'],
                'good_with'           => ['Adults', 'Rabbits'],
                'not_good_with'       => ['Dogs', 'Cats'],
            ],
            [
                'shelter_id'          => $shelter3->id,
                'name'                => 'Peanut',
                'species'             => 'Rabbit',
                'breed'               => 'Mini Rex',
                'age'                 => 2,
                'age_unit'            => 'years',
                'gender'              => 'Male',
                'size'                => 'Small',
                'color'               => 'Chocolate',
                'medical_status'      => 'Healthy',
                'is_vetted'           => true,
                'availability_status' => true,
                'adoption_fee'        => 75.00,
                'description'         => 'Peanut has the softest velvet-like fur you\'ll ever feel. He is calm and gentle, enjoys being held, and can spend hours grooming himself on the couch beside you.',
                'temperament_tags'    => ['Calm', 'Good with Kids', 'Senior Friendly'],
                'good_with'           => ['Children', 'Adults', 'Rabbits'],
                'not_good_with'       => ['Dogs'],
            ],

            // ─ New: Birds ────────────────────────────────────────────────────
            [
                'shelter_id'          => $shelter2->id,
                'name'                => 'Mango',
                'species'             => 'Bird',
                'breed'               => 'Cockatiel',
                'age'                 => 3,
                'age_unit'            => 'years',
                'gender'              => 'Male',
                'size'                => 'Small',
                'color'               => 'Yellow & Grey',
                'medical_status'      => 'Healthy',
                'is_vetted'           => true,
                'availability_status' => true,
                'adoption_fee'        => 90.00,
                'description'         => 'Mango is a sociable cockatiel who whistles tunes, mimics household sounds, and loves shoulder rides. He thrives with daily interaction and plenty of foraging toys.',
                'temperament_tags'    => ['Playful', 'Good with Kids', 'First-Time Owner'],
                'good_with'           => ['Adults', 'Children', 'Birds'],
                'not_good_with'       => ['Cats', 'Dogs'],
            ],
            [
                'shelter_id'          => $shelter3->id,
                'name'                => 'Kiwi',
                'species'             => 'Bird',
                'breed'               => 'Budgerigar',
                'age'                 => 1,
                'age_unit'            => 'years',
                'gender'              => 'Female',
                'size'                => 'Small',
                'color'               => 'Green & Yellow',
                'medical_status'      => 'Healthy',
                'is_vetted'           => true,
                'availability_status' => true,
                'adoption_fee'        => 50.00,
                'description'         => 'Kiwi is a cheerful little budgie who chats away happily from dawn to dusk. She enjoys mirrors, bells, and chatting back at the TV. Perfect for a first-time bird owner.',
                'temperament_tags'    => ['Playful', 'First-Time Owner', 'Good with Kids'],
                'good_with'           => ['Adults', 'Children', 'Birds'],
                'not_good_with'       => ['Cats', 'Dogs'],
            ],
            [
                'shelter_id'          => $shelter1->id,
                'name'                => 'Rio',
                'species'             => 'Bird',
                'breed'               => 'Sun Conure',
                'age'                 => 4,
                'age_unit'            => 'years',
                'gender'              => 'Male',
                'size'                => 'Small',
                'color'               => 'Yellow & Orange',
                'medical_status'      => 'Healthy',
                'is_vetted'           => true,
                'availability_status' => true,
                'adoption_fee'        => 200.00,
                'description'         => 'Rio is a vibrant Sun Conure with a personality as colourful as his feathers. He loves cuddles, learning tricks, and being the loudest (and happiest) bird in the room.',
                'temperament_tags'    => ['High Energy', 'Playful', 'Good with Pets'],
                'good_with'           => ['Adults', 'Birds'],
                'not_good_with'       => ['Cats', 'Dogs', 'Children'],
            ],

            // ─ New: Other ────────────────────────────────────────────────────
            [
                'shelter_id'          => $shelter3->id,
                'name'                => 'Pebbles',
                'species'             => 'Other',
                'breed'               => 'Guinea Pig',
                'age'                 => 1,
                'age_unit'            => 'years',
                'gender'              => 'Female',
                'size'                => 'Small',
                'color'               => 'Orange & White',
                'medical_status'      => 'Healthy',
                'is_vetted'           => true,
                'availability_status' => true,
                'adoption_fee'        => 40.00,
                'description'         => 'Pebbles is a friendly guinea pig who wheeks (squeaks) loudly when it\'s veggie time. She loves being hand-fed leafy greens and enjoys exploring her playpen with her favourite wooden chews.',
                'temperament_tags'    => ['Calm', 'Good with Kids', 'First-Time Owner'],
                'good_with'           => ['Children', 'Adults', 'Guinea Pigs'],
                'not_good_with'       => ['Dogs', 'Cats'],
            ],
            [
                'shelter_id'          => $shelter2->id,
                'name'                => 'Whisker',
                'species'             => 'Other',
                'breed'               => 'Ferret',
                'age'                 => 2,
                'age_unit'            => 'years',
                'gender'              => 'Male',
                'size'                => 'Small',
                'color'               => 'Sable',
                'medical_status'      => 'Healthy',
                'is_vetted'           => true,
                'availability_status' => true,
                'adoption_fee'        => 110.00,
                'description'         => 'Whisker is a mischievous ferret who hides toys, steals socks, and dances the weasel war dance when excited. He bonds deeply with his owners and loves supervised free-roam time.',
                'temperament_tags'    => ['High Energy', 'Playful'],
                'good_with'           => ['Adults'],
                'not_good_with'       => ['Birds', 'Rabbits', 'Guinea Pigs', 'Cats', 'Dogs'],
            ],
            [
                'shelter_id'          => $shelter1->id,
                'name'                => 'Nugget',
                'species'             => 'Other',
                'breed'               => 'Hamster',
                'age'                 => 6,
                'age_unit'            => 'months',
                'gender'              => 'Female',
                'size'                => 'Small',
                'color'               => 'Golden',
                'medical_status'      => 'Healthy',
                'is_vetted'           => true,
                'availability_status' => true,
                'adoption_fee'        => 25.00,
                'description'         => 'Nugget is a round, fluffy hamster who stuffs her cheeks with enthusiasm and runs her wheel like she\'s training for a marathon. She is very easy to care for and ideal for beginners.',
                'temperament_tags'    => ['Calm', 'First-Time Owner'],
                'good_with'           => ['Adults', 'Children'],
                'not_good_with'       => ['Cats', 'Dogs', 'Ferrets'],
            ],
        ];

        // Real Unsplash photos — cropped to 400×400
        $q = 'w=400&h=400&fit=crop&auto=format&q=80';
        $imageUrls = [
            'Buddy'   => "https://images.unsplash.com/photo-1633722715463-d30f4f325e24?{$q}", // Golden Retriever in grass
            'Luna'    => "https://images.unsplash.com/photo-1472053092455-ee16a8b358b9?{$q}", // Grey/Russian Blue cat
            'Max'     => "https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?{$q}", // Black & tan German Shepherd
            'Cleo'    => "https://images.unsplash.com/photo-1568152950566-c1bf43f4ab28?{$q}", // Siamese cat
            'Rocky'   => "https://images.unsplash.com/photo-1614178730713-4badc749c333?{$q}", // Chocolate Labrador
            'Daisy'   => "https://images.unsplash.com/photo-1613210609371-455e3aa5fb8c?{$q}", // Cavalier King Charles Spaniel
            'Charlie' => "https://images.unsplash.com/photo-1707298737261-069e2d529eaa?{$q}", // Beagle in grass
            'Nala'    => "https://images.unsplash.com/photo-1503256207526-0d5d80fa2f47?{$q}", // Black & white Border Collie
            'Oliver'  => "https://images.unsplash.com/photo-1455970022149-a8f26b6902dd?{$q}", // Long-fur brown Maine Coon
            'Bella'   => "https://images.unsplash.com/photo-1591429939960-b7d5add10b5c?{$q}", // White Persian cat
            'Thumper' => "https://images.unsplash.com/photo-1535241749838-299277b6305f?{$q}", // White & brown Holland Lop
            'Hazel'   => "https://images.unsplash.com/photo-1513303562411-8b5ed62bccf2?{$q}", // White & grey Lionhead rabbit
            'Peanut'  => "https://images.unsplash.com/photo-1514917151705-150d9bcf5acd?{$q}", // Brown rabbit on textile
            'Mango'   => "https://images.unsplash.com/photo-1517101724602-c257fe568157?{$q}", // Yellow Cockatiel portrait
            'Kiwi'    => "https://images.unsplash.com/photo-1560595643-90bb555b2eaa?{$q}", // Yellow & green Budgerigar
            'Rio'     => "https://images.unsplash.com/photo-1550539153-796e3d18b47f?{$q}", // Yellow & green Sun Conure
            'Pebbles' => "https://images.unsplash.com/photo-1612267168669-679c961c5b31?{$q}", // Brown & white Guinea Pig
            'Whisker' => "https://images.unsplash.com/photo-1571941727012-783f3768de46?{$q}", // Ferret being held
            'Nugget'  => "https://images.unsplash.com/photo-1425082661705-1834bfd09dca?{$q}", // Brown hamster close-up
        ];

        foreach ($pets as $data) {
            $pet = Pet::create(array_merge($data, ['created_by' => $staff->id]));

            PetImage::create([
                'pet_id'     => $pet->id,
                'url'        => $imageUrls[$data['name']],
                'is_primary' => true,
                'order'      => 0,
            ]);
        }

        $this->command->info('Seeded ' . count($pets) . ' pets across 3 shelters.');
    }
}
