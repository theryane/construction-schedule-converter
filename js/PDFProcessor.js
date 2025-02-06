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
            line.sort((a, b) => a.x - b.x);
            
            if (this.isHeaderRow(line) || this.isPageNumber(line)) {
                return;
            }

            if (this.isSectionHeader(line)) {
                currentSection = line[0].text;
                return;
            }

            const activity = this.parseLine(line, currentSection);
            if (activity) {
                activities.push(activity);
            }
        });

        return activities;
    }

    formatScheduleData(data) {
        const header = 'Activity ID,Activity Name,Original Duration,Remaining Duration,Start Date,Finish Date';
        const rows = data.map(activity => 
            `${activity.activityId},"${activity.activityName}",${activity.originalDuration},${activity.remainingDuration},${activity.startDate},${activity.finishDate}`
        );
        
        return [header, '', ...rows].join('\n\n');
    }

    // Helper methods remain the same
}

// Make PDFProcessor available globally
window.PDFProcessor = PDFProcessor;
console.log('PDFProcessor defined');
