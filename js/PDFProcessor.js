class PDFProcessor {
    constructor() {
        console.log('PDFProcessor initialized');
        this.columnRanges = {
            activityId: { start: 0, end: 100 },
            activityName: { start: 100, end: 300 },
            originalDuration: { start: 300, end: 400 },
            remainingDuration: { start: 400, end: 500 },
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
            const pageItems = this.processPageContent(textContent.items);
            scheduleItems.push(...pageItems);
        }
        return scheduleItems;
    }

    processPageContent(items) {
        const lines = this.groupItemsByLine(items);
        return this.parseLines(lines);
    }

    groupItemsByLine(items) {
        const lines = new Map();
        items.forEach(item => {
            const y = Math.round(item.transform[5]);
            if (!lines.has(y)) {
                lines.set(y, []);
            }
            lines.get(y).push({
                text: item.str,
                x: item.transform[4]
            });
        });
        return Array.from(lines.values());
    }

    parseLines(lines) {
        const activities = [];
        let currentSection = '';

        lines.forEach(line => {
            // Sort items by x position
            line.sort((a, b) => a.x - b.x);
            
            // Create a single string from all text items in the line
            const lineText = line.map(item => item.text).join(' ');

            // Skip header rows and page numbers
            if (this.isHeaderRow(lineText) || this.isPageNumber(lineText)) {
                return;
            }

            if (this.isSectionHeader(lineText)) {
                currentSection = lineText;
                return;
            }

            const activity = this.parseLine(line, currentSection);
            if (activity) {
                activities.push(activity);
            }
        });

        return activities;
    }

    isHeaderRow(text) {
        return text.includes('Activity ID') || 
               text.includes('Original Duration') ||
               text.includes('Activity Name');
    }

    isPageNumber(text) {
        return text.match(/Page \d+ of \d+/i) !== null;
    }

    isSectionHeader(text) {
        return text.match(/^[A-Z\s-]+$/) && 
               !text.includes('REED') &&
               text.length > 3;
    }

    parseLine(line, section) {
        if (line.length < 4) return null;

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
            const position = this.determinePosition(item.x);
            if (position) {
                activity[position] += (activity[position] ? ' ' : '') + item.text;
            }
        });

        return this.validateActivity(activity) ? this.cleanActivity(activity) : null;
    }

    determinePosition(x) {
        for (const [key, range] of Object.entries(this.columnRanges)) {
            if (x >= range.start && x < range.end) {
                return key;
            }
        }
        return null;
    }

    validateActivity(activity) {
        return activity.activityId && 
               !activity.activityId.includes('Total') &&
               !activity.activityId.includes('PAGE');
    }

    cleanActivity(activity) {
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
        return date.trim()
            .replace(/\*/g, '')
            .replace(/\s+/g, ' ');
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

        return [header, '', ...rows].join('\n\n');
    }
}

window.PDFProcessor = PDFProcessor;
console.log('PDFProcessor defined');
