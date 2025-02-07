class PDFProcessor {
    constructor() {
        console.log('PDFProcessor initialized');
        // Adjusted column ranges based on PDF layout
        this.columnRanges = {
            activityId: { start: 0, end: 80 },
            activityName: { start: 80, end: 350 },
            originalDuration: { start: 350, end: 450 },
            remainingDuration: { start: 450, end: 550 },
            startDate: { start: 550, end: 650 },
            finishDate: { start: 650, end: 750 }
        };
    }

    async processSchedule(pdfData) {
        try {
            console.log('Processing schedule...');
            const pdf = await pdfjsLib.getDocument(pdfData).promise;
            const scheduleData = await this.extractScheduleData(pdf);
            return this.formatScheduleData(scheduleData);
        } catch (error) {
            console.error('Error processing schedule:', error);
            throw new Error('Failed to process schedule PDF');
        }
    }

    async extractScheduleData(pdf) {
        const scheduleItems = [];
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            const pageItems = this.processPageContent(textContent.items);
            scheduleItems.push(...pageItems);
        }
        return scheduleItems;
    }

    processPageContent(items) {
        // Group items by vertical position (y-coordinate)
        const lineMap = new Map();
        
        items.forEach(item => {
            const y = Math.round(item.transform[5]);
            if (!lineMap.has(y)) {
                lineMap.set(y, []);
            }
            lineMap.get(y).push({
                text: item.str,
                x: item.transform[4]
            });
        });

        // Convert map to sorted array of lines
        const sortedLines = Array.from(lineMap.entries())
            .sort((a, b) => b[0] - a[0]) // Sort by y-coordinate descending
            .map(([_, items]) => items.sort((a, b) => a.x - b.x)); // Sort items within each line by x-coordinate

        return this.parseLines(sortedLines);
    }

    parseLines(lines) {
        const activities = [];
        let currentSection = '';

        for (const line of lines) {
            // Skip empty lines
            if (line.length === 0) continue;

            // Create full line text for checking headers
            const lineText = line.map(item => item.text).join(' ');

            // Skip header rows and page numbers
            if (this.isSkipLine(lineText)) continue;

            // Check for section headers
            if (this.isSectionHeader(lineText)) {
                currentSection = lineText.trim();
                continue;
            }

            // Parse activity data
            const activity = this.parseActivity(line, currentSection);
            if (activity) {
                activities.push(activity);
            }
        }

        return activities;
    }

    isSkipLine(text) {
        return text.includes('Activity ID') || 
               text.includes('Original Duration') ||
               text.match(/Page \d+ of \d+/) ||
               text.includes('Full WBS') ||
               text.includes('Remaining Level') ||
               text.includes('Actual Level');
    }

    isSectionHeader(text) {
        return text.match(/^[A-Z\s-]+$/) && 
               !text.includes('REED') &&
               text.length > 3;
    }

    parseActivity(line, section) {
        const activity = {
            section: section,
            activityId: '',
            activityName: '',
            originalDuration: '',
            remainingDuration: '',
            startDate: '',
            finishDate: ''
        };

        line.forEach(item => {
            const fieldType = this.determineField(item.x);
            if (fieldType) {
                if (activity[fieldType]) {
                    activity[fieldType] += ' ' + item.text;
                } else {
                    activity[fieldType] = item.text;
                }
            }
        });

        return this.validateAndCleanActivity(activity);
    }

    determineField(x) {
        for (const [field, range] of Object.entries(this.columnRanges)) {
            if (x >= range.start && x < range.end) {
                return field;
            }
        }
        return null;
    }

    validateAndCleanActivity(activity) {
        // Skip if no valid activity ID or if it's a total row
        if (!activity.activityId || 
            activity.activityId.includes('Total') || 
            activity.activityId.includes('PAGE')) {
            return null;
        }

        // Clean up the activity data
        return {
            section: activity.section.trim(),
            activityId: activity.activityId.trim(),
            activityName: activity.activityName.trim(),
            originalDuration: activity.originalDuration.trim(),
            remainingDuration: activity.remainingDuration.trim(),
            startDate: this.cleanDate(activity.startDate),
            finishDate: this.cleanDate(activity.finishDate)
        };
    }

    cleanDate(date) {
        if (!date) return '';
        return date.trim()
            .replace(/\*/g, '')  // Remove asterisks
            .replace(/\s+/g, ' ') // Replace multiple spaces with single space
            .replace(/\sA$/, ''); // Remove trailing 'A' for actual dates
    }

    formatScheduleData(data) {
        // Create header row
        const header = 'Activity ID,Activity Name,Original Duration,Remaining Duration,Start Date,Finish Date';
        
        // Format each activity row
        const rows = data.map(item => {
            return [
                item.activityId,
                `"${item.activityName}"`, // Quote activity names to handle commas
                item.originalDuration,
                item.remainingDuration,
                item.startDate,
                item.finishDate
            ].join(',');
        });

        // Combine header and rows with double line breaks for clarity
        return header + '\n\n' + rows.join('\n');
    }
}

// Make the processor available globally
window.PDFProcessor = PDFProcessor;
console.log('PDFProcessor defined');
