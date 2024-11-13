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
            const [result, created] = await Person.findOrCreate({
                where: {
                    firstName: person.firstName,
                    lastName: person.lastName
                },
                defaults: person
            });

            if (created) {
                stats.added++;
            } else {
                stats.existing++;
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
                        'Weekly Tasks',
                        'Monthly Tasks',
                        'Morning Tasks',
                        'Afternoon Tasks'
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
                    description: "Clean the cat litter box and refill with 1 inch of fresh litter.",
                    template: true,
                    priority: 1,
                    addedBy: "admin",
                    templateName: "Daily Tasks" 
                },
                {
                    name: "Pick Up Dishes",
                    description: "Periodically check the house (especially bedrooms) for dirty dishes and bring them to the kitchen.",
                    template: true,
                    priority: 1,
                    addedBy: "admin",
                    templateName: "Daily Tasks"
                },
                {
                    name: "Take Out Trash",
                    description: "Remove trash from upstairs bathrooms and bedrooms, downstairs bathroom, kitchen, and powder room.\n" +
                        "* replace trash bags in each garbage can\n" +
                        "* replace box of garbage bags if empty\n" +
                        "* take trash out to the porch and stack neatly",
                    template: true,
                    priority: 1,
                    addedBy: "admin",
                    templateName: "Daily Tasks"
                },
                {
                    name: "Clean Kitchen",
                    description: "Wipe down kitchen counters, clean stove top, and clean microwave.",
                    priority: 1,
                    template: true,
                    added_by: "admin",
                    templateName: "Daily Tasks"
                },
                {
                    name: "Vacuum first floor carpets",
                    description: "Vacuum first floor rugs in living room, dining room, foyer, and both bedrooms.",
                    priority: 1,
                    template: true,
                    added_by: "admin",
                    templateName: "Daily Tasks"
                },
                {
                    name: "Refill toilet paper",
                    description: "Make sure there are at least two (2) extra rolls in each bathroom.\n" +
                        "Refill toilet paper in:\n" +
                        " * upstairs bathrooms\n" +
                        " * downstairs bathroom\n" +
                        " * downstairs powder room",
                    priority: 1,
                    template: true,
                    added_by: "admin",
                    templateName: "Daily Tasks"
                },
                {
                    name: "Collect dirty laundry",
                    description: "Collect dirty laundry from each senior's room.\n" +
                        " * All laundry with urine on it goes into white baskets, not blue baskets.\n" +
                        " * Wash dirty laundry on Sanitary cycle with bleach.",
                    priority: 1,
                    template: true,
                    added_by: "admin",
                    templateName: "Daily Tasks"
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
                    added_by: "admin",
                    templateName: "Monthly Tasks"
                },
                // Morning Tasks
                {
                    name: "Make Beds",
                    description: "Make all beds in the house",
                    template: true,
                    priority: 1,
                    addedBy: "admin",
                    templateName: "Morning Tasks"
                },
                {
                    name: "Empty Dishwasher",
                    description: "Empty clean dishes from dishwasher",
                    template: true,
                    priority: 1,
                    addedBy: "admin",
                    templateName: "Morning Tasks"
                },
                // Afternoon Tasks
                {
                    name: "Load Dishwasher",
                    description: "Load dirty dishes into dishwasher and run if full",
                    template: true,
                    priority: 1,
                    addedBy: "admin",
                    templateName: "Afternoon Tasks"
                },
                {
                    name: "Wipe Counters",
                    description: "Clean and sanitize kitchen counters",
                    template: true,
                    priority: 1,
                    addedBy: "admin",
                    templateName: "Afternoon Tasks"
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
                password: await argon2.hash("admin")
            },
            {
                firstName: "Shakeem",
                lastName: "Bembridge",
                username: "bembridges",
                password: await argon2.hash("password")
            },
            {
                firstName: "Mervat",
                lastName: "Malak",
                username: "malakm",
                password: await argon2.hash("password")
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