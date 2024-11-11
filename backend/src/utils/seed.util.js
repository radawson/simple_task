const { Task, Template, User } = require('../models');
const Logger = require('../core/Logger');
const argon2 = require('argon2');
const logger = Logger.getInstance();

class Seeder {
    static async seedDatabase() {
        let message = "Database seeded with:\n";

        try {
            // Always seed users first
            const users = await this.seedUsers();
            message += `${users.length} users added.\n`;

            // Then seed templates
            const templates = await this.seedTemplates();
            message += `${templates.length} templates added.\n`;

            // Finally seed tasks
            const tasks = await this.seedTasks();
            message += `${tasks.length} tasks added.\n`;

            logger.info(message);
            return { success: true, message };
        } catch (error) {
            logger.error(`Seed failed: ${error.message}`);
            throw error;
        }
    }

    static async seedUsers() {
        const users = [
            {
                firstName: "Rick",
                lastName: "Dawson",
                username: "admin",
                isAdmin: true,
                password: await argon2.hash("admin")
            },
            {
                firstName: "Rose",
                lastName: "Ponzio",
                username: "ponzior",
                password: await argon2.hash("password")
            }
        ];

        return await User.bulkCreate(users);
    }

    static async seedTemplates() {
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

        const templates = templateNames.map(name => ({ name }));
        return await Template.bulkCreate(templates);
    }

    static async seedTasks() {
        try {
            // Get templates with error checking
            const templates = await Promise.all([
                Template.findOne({ where: { name: 'Daily Tasks' } }),
                Template.findOne({ where: { name: 'Weekly Tasks' } }),
                Template.findOne({ where: { name: 'Monthly Tasks' } }),
                Template.findOne({ where: { name: 'Morning Tasks' } }),
                Template.findOne({ where: { name: 'Afternoon Tasks' } })
            ]);

            // Verify all templates exist
            const [dailyTemplate, weeklyTemplate, monthlyTemplate, morningTemplate, afternoonTemplate] = templates;

            if (!dailyTemplate || !weeklyTemplate || !monthlyTemplate || !morningTemplate || !afternoonTemplate) {
                throw new Error('Required templates not found. Please ensure templates are seeded first.');
            }

            const tasks = [
                // Daily Tasks
                {
                    name: "Clean Cat Litter",
                    description: "Clean the cat litter box and refill with 1 inch of fresh litter.",
                    template: true,
                    priority: 1,
                    addedBy: "admin",
                    TemplateId: dailyTemplate.id  // Use TemplateId instead of Templates array
                },
                {
                    name: "Pick Up Dishes",
                    description: "Periodically check the house (especially bedrooms) for dirty dishes and bring them to the kitchen.",
                    template: true,
                    priority: 1,
                    addedBy: "admin",
                    Templates: [dailyTemplate]
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
                    Templates: [dailyTemplate]
                },
                // Weekly Tasks
                {
                    name: "Vacuum Entire House",
                    description: "Vacuum all carpets and rugs throughout the house",
                    template: true,
                    priority: 2,
                    addedBy: "admin",
                    Templates: [weeklyTemplate]
                },
                {
                    name: "Clean Bathrooms",
                    description: "Clean all bathrooms including toilets, sinks, showers, and floors",
                    template: true,
                    priority: 2,
                    addedBy: "admin",
                    Templates: [weeklyTemplate]
                },
                {
                    name: "Change Bed Linens",
                    description: "Change sheets and pillowcases on all beds",
                    template: true,
                    priority: 2,
                    addedBy: "admin",
                    Templates: [weeklyTemplate]
                },
                // Monthly Tasks
                {
                    name: "Check Smoke Detectors",
                    description: "Test all smoke detectors and replace batteries if needed",
                    template: true,
                    priority: 3,
                    addedBy: "admin",
                    Templates: [monthlyTemplate]
                },
                {
                    name: "Deep Clean Kitchen",
                    description: "Clean all appliances, cabinets, and pantry thoroughly",
                    template: true,
                    priority: 3,
                    addedBy: "admin",
                    Templates: [monthlyTemplate]
                },
                // Morning Tasks
                {
                    name: "Make Beds",
                    description: "Make all beds in the house",
                    template: true,
                    priority: 1,
                    addedBy: "admin",
                    Templates: [morningTemplate]
                },
                {
                    name: "Empty Dishwasher",
                    description: "Empty clean dishes from dishwasher",
                    template: true,
                    priority: 1,
                    addedBy: "admin",
                    Templates: [morningTemplate]
                },
                // Afternoon Tasks
                {
                    name: "Load Dishwasher",
                    description: "Load dirty dishes into dishwasher and run if full",
                    template: true,
                    priority: 1,
                    addedBy: "admin",
                    Templates: [afternoonTemplate]
                },
                {
                    name: "Wipe Counters",
                    description: "Clean and sanitize kitchen counters",
                    template: true,
                    priority: 1,
                    addedBy: "admin",
                    Templates: [afternoonTemplate]
                }
            ];

            // Create tasks without including Template association
            const createdTasks = await Task.bulkCreate(tasks);

            // Add template associations separately
            for (const task of createdTasks) {
                const template = templates.find(t => t.id === task.TemplateId);
                if (template) {
                    await task.addTemplate(template);
                }
            }

            return createdTasks;
        } catch (error) {
            logger.error(`Failed to seed tasks: ${error.message}`);
            throw error;
        }
    }
}

module.exports = Seeder;