class PDFProcessor {
    constructor() {
        console.log('PDFProcessor initialized');
        this.columnRanges = {
            activityId: { start: 0, end: 50 },      // Adjusted for MILE-xxx format
            activityName: { start: 50, end: 400 },  // Wider range for full names
            originalDuration: { start: 400, end: 450 },
            remainingDuration: { start: 450, end: 500 },
            startDate: { start: 500, end: 600 },
            finishDate: { start: 600, end: 700 }
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
            const pageItems = this.processPageItems(textContent.items);
            scheduleItems.push(...pageItems);
        }
        return scheduleItems;
    }

    processPageItems(items) {
        // Group items by y-coordinate (line)
        const lineGroups = new Map();
        items.forEach(item => {
            const y = Math.round(item.transform[5]);
            if (!lineGroups.has(y)) {
                lineGroups.set(y, []);
            }
            lineGroups.get(y).push({
                text: item.str,
                x: item.transform[4]
            });
        });

        // Convert to array and sort by y-coordinate (top to bottom)
        const sortedLines = Array.from(lineGroups.entries())
            .sort((a, b) => b[0] - a[0])
            .map(([_, items]) => items.sort((a, b) => a.x - b.x));

        return this.processLines(sortedLines);
    }

    processLines(lines) {
        const activities = [];
        let currentActivity = null;

        for (const line of lines) {
            // Skip empty lines
            if (line.length === 0) continue;

            const lineText = line.map(item => item.text).join(' ');

            // Skip headers and non-activity lines
            if (this.shouldSkipLine(lineText)) continue;

            // Check if this is a milestone or activity line
            if (this.isActivityLine(line)) {
                if (currentActivity) {
                    activities.push(this.cleanActivity(currentActivity));
                }
                currentActivity = this.parseActivityLine(line);
            }
        }

        // Add last activity if exists
        if (currentActivity) {
            activities.push(this.cleanActivity(currentActivity));
        }

        return activities;
    }

    shouldSkipLine(text) {
        return text.includes('Activity ID') ||
               text.includes('Duration') ||
               text.match(/Page \d+ of \d+/) ||
               text.includes('Full WBS') ||
               text.includes('WALTER REED');
    }

    isActivityLine(line) {
        // Check if line starts with a valid activity ID pattern
        const firstItem = line[0];
        return firstItem && (
            firstItem.text.match(/^MILE-\d+/) ||
            firstItem.text.match(/^P1MILE-\d+/) ||
            firstItem.text.match(/^LOE-/) ||
            firstItem.text.match(/^SUMM-/)
        );
    }

    parseActivityLine(line) {
        const activity = {
            activityId: '',
            activityName: '',
            originalDuration: '',
            remainingDuration: '',
            startDate: '',
            finishDate: ''
        };

        let currentField = null;
        line.forEach(item => {
            const x = item.x;
            
            // Determine which field this item belongs to
            if (x < this.columnRanges.activityId.end) {
                activity.activityId += (activity.activityId ? ' ' : '') + item.text;
            } else if (x < this.columnRanges.activityName.end) {
                activity.activityName += (activity.activityName ? ' ' : '') + item.text;
            } else if (x < this.columnRanges.originalDuration.end && this.isNumber(item.text)) {
                activity.originalDuration = item.text;
            } else if (x < this.columnRanges.remainingDuration.end && this.isNumber(item.text)) {
                activity.remainingDuration = item.text;
            } else if (x < this.columnRanges.startDate.end && this.isDate(item.text)) {
                activity.startDate = item.text;
            } else if (x > this.columnRanges.startDate.end && this.isDate(item.text)) {
                activity.finishDate = item.text;
            }
        });

        return activity;
    }

    isNumber(text) {
        return !isNaN(text) && text.trim() !== '';
    }

    isDate(text) {
        return text.match(/\d{2}-[A-Za-z]{3}-\d{2}/);
    }

    cleanActivity(activity) {
        return {
            activityId: activity.activityId.trim(),
            activityName: activity.activityName.trim(),
            originalDuration: activity.originalDuration || '0',
            remainingDuration: activity.remainingDuration || '0',
            startDate: this.cleanDate(activity.startDate),
            finishDate: this.cleanDate(activity.finishDate)
        };
    }

    cleanDate(date) {
        if (!date) return '';
        return date.trim()
            .replace(/\*/g, '')
            .replace(/A$/, '')
            .trim();
    }

    formatScheduleData(data) {
        const header = 'Activity ID,Activity Name,Original Duration,Remaining Duration,Start Date,Finish Date';
        const rows = data.map(item => [
            item.activityId,
            `"${item.activityName}"`,
            item.originalDuration,
            item.remainingDuration,
            item.startDate,
            item.finishDate
        ].join(','));

        return header + '\n\n' + rows.join('\n');
    }
}

window.PDFProcessor = PDFProcessor;
console.log('PDFProcessor defined');
