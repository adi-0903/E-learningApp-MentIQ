import api from './api';

export const aiApi = {
    askGlobal: (query: string, image?: any) => {
        const formData = new FormData();
        formData.append('query', query);
        formData.append('scope', 'global');
        if (image) {
            // React Native Image Picker object
            const filename = image.uri.split('/').pop();
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : `image`;

            formData.append('image', {
                uri: image.uri,
                name: filename,
                type
            } as any);
        }
        return api.upload('/v1/ai/ask/', formData);
    },

    askLesson: (query: string, lessonId: string) =>
        api.post('/v1/ai/ask/', { query, lesson_id: lessonId, scope: 'lesson' }),

    generateQuiz: (lessonId: string) =>
        api.post('/v1/ai/generate-quiz/', { lesson_id: lessonId }),

    generateFlashcards: (topic: string) =>
        api.post('/v1/ai/generate-flashcards/', { topic }),

    generateStudyPlan: (examDate: string, hoursPerDay: number, subject?: string) =>
        api.post('/v1/ai/generate-plan/', { exam_date: examDate, hours_per_day: hoursPerDay, subject: subject || '' }),
};
