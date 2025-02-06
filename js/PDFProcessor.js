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
            if (pageItems.length > 0) {
                scheduleItems.push(...pageItems);
            }
        }
        return scheduleItems;
    }

    processPageContent(items) {
        const lines = [];
        let currentLine = [];
        let currentY = null;

        // Sort items by vertical position
        items.sort((a, b) => b.transform[5] - a.transform[5]);

        for (const item of items) {
            const y = Math.round(item.transform[5]);
            if (currentY === null) {
                currentY = y;
            }

            if (Math.abs(y - currentY) > 5) {
                if (currentLine.length > 0) {
                    lines.push([...currentLine]);
                }
                currentLine = [];
                currentY = y;
            }

            currentLine.push({
                text: item.str,
                x: item.transform[4]
            });
        }

        if (currentLine.length > 0) {
            lines.push(currentLine);
        }

        return this.parseLines(lines);
    }

    parseLines(lines) {
        const activities = [];
        let currentSection = '';

        for (const line of lines) {
            // Sort items in line by x position
            line.sort((a, b) => a.x - b.x);

            // Skip header and page number lines
            const lineText = line.map(item => item.text).join(' ');
            if (lineText.includes('Activity ID') || lineText.match(/Page \d+ of \d+/)) {
                continue;
            }

            // Check for section headers
            if (lineText.match(/^[A-Z\s-]+$/) && !lineText.includes('REED')) {
                currentSection = lineText;
                continue;
            }

            // Process activity line
            const activity = this.parseActivityLine(line, currentSection);
            if (activity) {
                activities.push(activity);
            }
        }

        return activities;
    }

    parseActivityLine(line, section) {
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
