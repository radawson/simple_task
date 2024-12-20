// src/utils/seed.util.js
import { Task, Template, User, Person } from '../models/index.js';
import Logger from '../core/Logger.js';
import argon2 from 'argon2';
const logger = Logger.getInstance();

class Seeder {
    static async seedDatabase() {
        let stats = {
            users: { added: 0, existing: 0 },
            persons: { added: 0, existing: 0 },
            templates: { added: 0, existing: 0 },
            tasks: { added: 0, existing: 0 }
        };

        try {
            await this.seedUsers(stats.users);
            await this.seedPersons(stats.persons);
            await this.seedTemplates(stats.templates);
            await this.seedTasks(stats.tasks);

            const message = Object.entries(stats)
                .map(([type, count]) =>
                    `${type}: ${count.added} added, ${count.existing} existing`)
                .join('\n');

            logger.info(`Database seeding completed:\n${message}`);
            return { success: true, stats };
        } catch (error) {
            logger.error(`Seed failed: ${error.message}`);
            throw error;
        }
    }

    static async seedPersons(stats) {
        const persons = [
            {
                firstName: "Everyone",
                lastName: " ",
            },
            {
                firstName: "George",
                lastName: "Dirschel",
                birthdate: "1938-05-27"
            },
            {
                firstName: "Kathy",
                lastName: "Dirschel",
                birthdate: "1942-06-15"
            },
            {
                firstName: "Pat",
                lastName: "Dawson",
                birthdate: "1945-02-21"
            }
        ];

        for (const person of persons) {
            const whereClause = { firstName: person.firstName };
    
            if (person.lastName !== undefined) {
                whereClause.lastName = person.lastName;
            }
    
            const [result, created] = await Person.findOrCreate({
                where: whereClause,
                defaults: person,
            });
    
            if (created) {
                stats.added += 1;
            } else {
                stats.existing += 1;
            }
        }
    }

    static async seedTemplates(stats) {
        const templateNames = [
            "Daily Tasks",
            "Monday Tasks",
            "Tuesday Tasks",
            "Wednesday Tasks",
            "Thursday Tasks",
            "Friday Tasks",
            "Saturday Tasks",
            "Sunday Tasks",
            "Weekly Tasks",
            "Monthly Tasks",
            "Morning Tasks",
            "Afternoon Tasks"
        ];

        for (const name of templateNames) {
            const [template, created] = await Template.findOrCreate({
                where: { name },
                defaults: { name }
            });

            if (created) {
                stats.added++;
            } else {
                stats.existing++;
            }
        }
    }

    static async seedTasks(stats) {
        try {
            const templates = await Template.findAll({
                where: {
                    name: [
                        'Daily Tasks',
                        'Saturday Tasks',
                        'Weekly Tasks',
                        'Monthly Tasks'
                    ]
                }
            });

            const templateMap = templates.reduce((acc, template) => {
                acc[template.name] = template;
                return acc;
            }, {});

            const seedTasks = [
                // Daily Tasks
                {
                    name: "Clean Cat Litter",
                    description: "Clean the cat litter box and refill with 1 inch of fresh litter.\n" +
					" * Sweep area around the cat boxes. Litter can be dumped into the cat boxes.\n" +
					" * Make sure there is fresh water in cat bowl.\n" +
					" * Removed litter and cat feces go in brown paper bags and go up to outside trash.",
                    template: true,
                    priority: 1,
                    addedBy: "admin",
                    templateName: "Daily Tasks" 
                },
                {
                    name: "Pick Up Dishes",
                    description: "Periodically check the house (especially the bedrooms) for dirty dishes and bring them to the kitchen.",
                    template: true,
                    priority: 1,
                    addedBy: "admin",
                    templateName: "Daily Tasks"
                },
                {
                    name: "Take Out Trash",
                    description: "Remove trash from upstairs bathrooms and bedrooms, downstairs bathroom, kitchen, and powder room.\n" +
                        " * replace trash bags in each garbage can\n" +
                        " * replace box of garbage bags if empty\n" +
                        " * take trash out to the porch and stack neatly.\n" +
						" * conbine small bags of trash into one when possible.",
                    template: true,
                    priority: 1,
                    addedBy: "admin",
                    templateName: "Daily Tasks"
                },
                {
                    name: "Clean Kitchen",
                    description: "Wipe down kitchen counters, clean stove top, and clean microwave." +
					" * Clean air fryer after use.\n" +
					" * Clean kitchen floor as necessary.\n" +
					" * Wipe out oven with water only, do not use soap or cleaners.",
                    priority: 1,
                    template: true,
                    addedBy: "admin",
                    templateName: "Daily Tasks"
                },
                {
                    name: "Vacuum first floor carpets",
                    description: "Vacuum first floor rugs in living room, dining room, bathrooms, and bedrooms.",
                    priority: 1,
                    template: true,
                    addedBy: "admin",
                    templateName: "Daily Tasks"
                },
                {
                    name: "Refill toilet paper",
                    description: "Make sure there are at least two (2) extra rolls in each bathroom.\n" +
						"Extra toilet paper is located on basement shelves.\n" +
                        "Refill toilet paper in:\n" +
                        " * upstairs bathrooms\n" +
                        " * downstairs bathroom\n" +
                        " * downstairs powder room",
                    priority: 1,
                    template: true,
                    addedBy: "admin",
                    templateName: "Daily Tasks"
                },
                {
                    name: "Collect dirty laundry",
                    description: "Collect dirty laundry from each senior's room.\n" +
                        " * All laundry with urine on it goes into white baskets, not blue baskets.\n" +
                        " * Wash dirty laundry on Sanitary cycle with bleach.",
                    priority: 1,
                    template: true,
                    addedBy: "admin",
                    templateName: "Daily Tasks"
                },
                {
                    name: "Bring George to the bathroom in the morning",
                    description: "Help George to the bathroom in the morning to clean him up for the day.\n" +
                        " * Change his underwear and clean his body as needed.\n" +
                        " * Change his clothes to fresh clothes for the day.\n" +
                        " * Help him brush his teeth and use mouthwash.\n" +
						" * Help him brush his hair.\n" +
                        " * Clean the bathroom sink and floor when he is done.",
                    priority: 1,
                    template: true,
                    addedBy: "admin",
                    templateName: "Daily Tasks"
                },
                {
                    name: "Breakfast for Pat",
                    description: "Wipe down the bed table with cleaning wipes.\n" +
                        " * Collect dirty dishes and silverware from the bedroom.",
                    priority: 1,
                    template: true,
                    addedBy: "admin",
                    templateName: "Daily Tasks"
                },
                {
                    name: "Morning Medicine for Pat",
                    description: "Give medicine from container.\n" +
                        " * Check container to make sure there are no pills left inside.\n" +
                        " * Bring a glass fo water specifically for swallowing pills.\n" +
                        " * Help her to sit up while taking the pills to prevent choking\n" +
                        " * Watch and assist to make sure all pills are taken.\n" +
                        " * Write down the time and check the boxes for her medicines.",
                    priority: 1,
                    template: true,
                    addedBy: "admin",
                    templateName: "Daily Tasks"
                },
                {
                    name: "Morning Medicine for Kathy",
                    description: "Give medicine from container.\n" +
                        " * Check container to make sure there are no pills left inside.\n" +
                        " * Bring a glass fo water specifically for swallowing pills.\n" +
                        " * Help her to sit up while taking the pills to prevent choking\n" +
                        " * Watch and assist to make sure all pills are taken.\n" +
                        " * Write down the time and check the boxes for her medicines.",
                    priority: 1,
                    template: true,
                    addedBy: "admin",
                    templateName: "Daily Tasks"
                },
                {
                    name: "Morning Medicine for George",
                    description: "Give medicine from container.\n" +
                        " * Check container to make sure there are no pills left inside.\n" +
                        " * Bring a glass fo water specifically for swallowing pills.\n" +
                        " * Help him to sit up while taking the pills to prevent choking\n" +
                        " * Watch and assist to make sure all pills are taken.\n" +
                        " * Write down the time and check the boxes for her medicines.",
                    priority: 1,
                    template: true,
                    addedBy: "admin",
                    templateName: "Daily Tasks"
                },
				{
                    name: "Clean Pat's Bedroom",
                    description: "Clean Pat's Bedroom Daily.\n" +
                        " * Sweep bedroom floor, especially in front of bed.\n" +
                        " * Change absorbent pads on bed and chair.\n" +
                        " * Change air freshener as needed.",
                    priority: 1,
                    template: true,
                    addedBy: "admin",
                    templateName: "Daily Tasks"
                },
				{
                    name: "Clean Pat's Bathroom",
                    description: "Clean Bathroom Daily.\n" +
                        " * Wipe down toilet seat daily and after toilet use.\n" +
                        " * Swiffer bathroom floor daily, including under floor mats.\n" +
                        " * Refill underwear/pads.",
                    priority: 1,
                    template: true,
                    addedBy: "admin",
                    templateName: "Daily Tasks"
                },
                {
                    name: "Breakfast for George and Kathy",
                    description: "Wake up George and Kathy with coffee and give them time to get out of bed.\n" +
                        " * Wipe down the table with cleaning wipes.\n" +
                        " * Collect dirty dishes, silverware and napkins from the bedroom.",
                    priority: 1,
                    template: true,
                    addedBy: "admin",
                    templateName: "Daily Tasks"
                },
                {
                    name: "Afternoon Medicine for George",
                    description: "Give medicine from pill container.\n" +
                        " * Check container to make sure there are no pills left inside.\n" +
                        " * Bring a glass fo water specifically for swallowing pills.\n" +
                        " * Help him to sit up while taking the pills to prevent choking\n" +
                        " * Watch and assist to make sure all pills are taken.\n" +
                        " * Write down the time and check the boxes for her medicines.",
                    priority: 2,
                    template: true,
                    addedBy: "admin",
                    templateName: "Daily Tasks"
                },
                {
                    name: "Evening Medicine for Kathy",
                    description: "Give medicine from pill container.\n" +
                        " * Check container to make sure there are no pills left inside.\n" +
                        " * Bring a glass fo water specifically for swallowing pills.\n" +
                        " * Help her to sit up while taking the pills to prevent choking\n" +
                        " * Watch and assist to make sure all pills are taken.\n" +
                        " * Write down the time and check the boxes for her medicines.",
                    priority: 3,
                    template: true,
                    addedBy: "admin",
                    templateName: "Daily Tasks"
                },
                {
                    name: "Evening Medicine for George",
                    description: "Give medicine from pill container.\n" +
                        " * Check container to make sure there are no pills left inside.\n" +
                        " * Bring a glass fo water specifically for swallowing pills.\n" +
                        " * Help him to sit up while taking the pills to prevent choking\n" +
                        " * Watch and assist to make sure all pills are taken.\n" +
                        " * Write down the time and check the boxes for her medicines.",
                    priority: 3,
                    template: true,
                    addedBy: "admin",
                    templateName: "Daily Tasks"
                },
                {
                    name: "Dinner for Pat",
                    description: "Wipe down the bed table with cleaning wipes.\n" +
                        " * Collect dirty dishes and silverware from the bedroom.",
                    priority: 3,
                    template: true,
                    addedBy: "admin",
                    templateName: "Daily Tasks"
                },
                {
                    name: "Dinner for George and Kathy",
                    description: "Wipe down the table with cleaning wipes.\n" +
                        " * Collect dirty dishes, silverware and napkins from the bedroom.\n",
                    priority: 3,
                    template: true,
                    addedBy: "admin",
                    templateName: "Daily Tasks"
                },
                {
                    name: "Bring George to the bathroom in the evening",
                    description: "Help George to the bathroom in the evening before leaving for the day.\n" +
                        " * Change his underwear and clean his body as needed.\n" +
                        " * Change his clothes to fresh clothes if needed.\n" +
						" * Refill underwear/pad so there are at least 6 for the next day.\n" +
                        " * Clean the bathroom sink and floor when he is done.",
                    priority: 3,
                    template: true,
                    addedBy: "admin",
                    templateName: "Daily Tasks"
                },
                // Saturday Tasks
                {
                    name: "George Shower",
                    description: "Help George to the shower and assist him with cleaning himself.\n" +
                        " * Heat up the bathroom and make sure the water is warm.\n" +
                        " * Help him to the shower and assist him with cleaning himself.\n" +
                        " * Change his clothes to fresh clothes for the day.\n" +
                        " * Help him with drying and dressing.",
                    priority: 1,
                    template: true,
                    addedBy: "admin",
                    templateName: "Saturday Tasks"
                },
                {
                    name: "Kathy Shower",
                    description: "Help Kathy to the shower and encourage her to clean herself.\n" +
                        " * Heat up the bathroom and make sure the water is warm.\n" +
                        " * Help her to the shower and assist her with cleaning herself if needed.\n" +
                        " * Help her select fresh clothes for the day.\n" +
                        " * Help her with drying and dressing if needed.",
                    priority: 1,
                    template: true,
                    addedBy: "admin",
                    templateName: "Saturday Tasks"
                },
                {
                    name: "Pat Shower",
                    description: "Help Pat to the shower and assist her with cleaning herself.\n" +
                        " * Heat up the bathroom and make sure the water is warm.\n" +
                        " * Help her to the shower and assist her with cleaning herself.\n" +
                        " * Change her clothes to fresh clothes for the day.\n" +
                        " * Help her with drying and dressing.",
                    priority: 1,
                    template: true,
                    addedBy: "admin",
                    templateName: "Saturday Tasks"
                },
                // Weekly Tasks
                {
                    name: "Vacuum Entire House",
                    description: "Vacuum all carpets and rugs throughout the house",
                    template: true,
                    priority: 2,
                    addedBy: "admin",
                    templateName: "Weekly Tasks"
                },
                {
                    name: "Clean Bathrooms",
                    description: "Clean all bathrooms including toilets, sinks, showers, and floors",
                    template: true,
                    priority: 2,
                    addedBy: "admin",
                    templateName: "Weekly Tasks"
                },
                {
                    name: "Change Bed Linens",
                    description: "Change sheets and pillowcases on all beds",
                    template: true,
                    priority: 2,
                    addedBy: "admin",
                    templateName: "Weekly Tasks"
                },
                // Monthly Tasks
                {
                    name: "Check Smoke Detectors",
                    description: "Test all smoke detectors and replace batteries if needed",
                    template: true,
                    priority: 3,
                    addedBy: "admin",
                    templateName: "Monthly Tasks"
                },
                {
                    name: "Deep Clean Kitchen",
                    description: "Clean all appliances, cabinets, and pantry thoroughly",
                    template: true,
                    priority: 3,
                    addedBy: "admin",
                    templateName: "Monthly Tasks"
                },
                {
                    name: "Replace HVAC filters",
                    description: "Replace HVAC Filters in:\n" +
                        " * upstairs unit\n" +
                        " * downstairs unit",
                    priority: 1,
                    template: true,
                    addedBy: "admin",
                    templateName: "Monthly Tasks"
                },
                {
                    name: "Empty Dishwasher",
                    description: "Empty clean dishes from dishwasher",
                    template: true,
                    priority: 1,
                    addedBy: "admin",
                    templateName: "Daily Tasks"
                },
                {
                    name: "Load Dishwasher",
                    description: "Load dirty dishes into dishwasher and run if full",
                    template: true,
                    priority: 2,
                    addedBy: "admin",
                    templateName: "Daily Tasks"
                },
                {
                    name: "Wipe Counters",
                    description: "Clean and sanitize kitchen counters",
                    template: true,
                    priority: 3,
                    addedBy: "admin",
                    templateName: "Daily Tasks"
                }
            ];

            for (const taskData of seedTasks) {
                const template = templateMap[taskData.templateName];

                if (!template) {
                    logger.warn(`Template "${taskData.templateName}" not found for task "${taskData.name}"`);
                    continue;
                }

                const { templateName, ...taskDetails } = taskData;

                try {
                    const [task, created] = await Task.findOrCreate({
                        where: {
                            name: taskData.name,
                            template: true,
                            templateId: template.id
                        },
                        defaults: {
                            ...taskDetails,
                            templateId: template.id
                        }
                    });

                    if (created) {
                        stats.added++;
                        logger.debug(`Created task: ${task.name}`);
                    } else {
                        stats.existing++;
                        logger.debug(`Task exists: ${task.name}`);
                    }
                } catch (error) {
                    logger.error(`Failed to create task "${taskData.name}": ${error.message}`);
                }
            }
        } catch (error) {
            logger.error('Task seeding failed:', error);
            throw error;
        }
    }

    static async seedUsers(stats) {
        const users = [
            {
                firstName: "Admin",
                lastName: "User",
                username: "admin",
                isAdmin: true,
                password: "$argon2id$v=19$m=65536,t=3,p=4$o+KqN5tXo5rMSjvDXLJDTg$jOLST3gTsAVfWjxcl9egIDU+0WvXz0K1yHaedCQphSM"
            },
            {
                firstName: "Shakeem",
                lastName: "Bembridge",
                username: "bembridges",
                password: "$argon2id$v=19$m=65536,t=3,p=4$YNC6FRIb/4MR1l9jmKR48Q$L0xh8gdGwtqmtPoI6WDI0dDy3XatD0hEwk4V7htqSkY"
            },
            {
                firstName: "Mervat",
                lastName: "Malak",
                displayName: "Mimi",
                username: "malakm",
                password: "$argon2id$v=19$m=65536,t=3,p=4$F6AWOCY7rGVESHILDRGqsg$nlTYuNRg7CxK6oTFOZclQLiT/35zltUyLwJVpf3EcyE"
            },
        ];

        for (const user of users) {
            const [result, created] = await User.findOrCreate({
                where: { username: user.username },
                defaults: user
            });

            if (created) {
                stats.added++;
            } else {
                stats.existing++;
            }
        }
    }
}

export { Seeder };
export default Seeder;