/**
 * [TODO] Step 0: Import the dependencies, fs and papaparse
 */
const fs = require('fs');
const Papa = require('papaparse');

/**
 * [TODO] Step 1: Parse the Data
 *      Parse the data contained in a given file into a JavaScript objectusing the modules fs and papaparse.
 *      According to Kaggle, there should be 2514 reviews.
 * @param {string} filename - path to the csv file to be parsed
 * @returns {Object} - The parsed csv file of app reviews from papaparse.
 */
function parseData(filename) {
    const fileContent = fs.readFileSync(filename, 'utf8');
    const result = Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
    });
    return result;
}

/**
 * [TODO] Step 2: Clean the Data
 *      Filter out every data record with null column values, ignore null gender values.
 *
 *      Merge all the user statistics, including user_id, user_age, user_country, and user_gender,
 *          into an object that holds them called "user", while removing the original properties.
 *
 *      Convert review_id, user_id, num_helpful_votes, and user_age to Integer
 *
 *      Convert rating to Float
 *
 *      Convert review_date to Date
 * @param {Object} csv - a parsed csv file of app reviews
 * @returns {Object} - a cleaned csv file with proper data types and removed null values
 */
function cleanData(csv) {
    const data = csv.data;

    const filtered = data.filter((record) => {
        for (const key in record) {
            if (
                key !== 'user_gender' &&
                (record[key] === null ||
                    record[key] === '' ||
                    record[key] === undefined)
            ) {
                return false;
            }
        }
        return true;
    });

    const cleaned = filtered.map((record) => {
        const user = {
            user_id: parseInt(record.user_id, 10),
            user_age: parseInt(record.user_age, 10),
            user_country: record.user_country,
            user_gender: record.user_gender || null,
        };

        const cleanedRecord = {
            review_id: parseInt(record.review_id, 10),
            app_name: record.app_name,
            app_category: record.app_category,
            review_text: record.review_text,
            review_language: record.review_language,
            rating: parseFloat(record.rating),
            review_date: new Date(record.review_date),
            verified_purchase:
                record.verified_purchase === 'True' ||
                record.verified_purchase === true,
            device_type: record.device_type,
            num_helpful_votes: parseInt(record.num_helpful_votes, 10),
            app_version: record.app_version,
            user: user,
        };

        return cleanedRecord;
    });

    return cleaned;
}

/**
 * [TODO] Step 3: Sentiment Analysis
 *      Write a function, labelSentiment, that takes in a rating as an argument
 *      and outputs 'positive' if rating is greater than 4, 'negative' is rating is below 2,
 *      and 'neutral' if it is between 2 and 4.
 * @param {Object} review - Review object
 * @param {number} review.rating - the numerical rating to evaluate
 * @returns {string} - 'positive' if rating is greater than 4, negative is rating is below 2,
 *                      and neutral if it is between 2 and 4.
 */
function labelSentiment({ rating }) {
    if (rating > 4) {
        return 'positive';
    } else if (rating < 2) {
        return 'negative';
    } else {
        return 'neutral';
    }
}

/**
 * [TODO] Step 3: Sentiment Analysis by App
 *      Using the previous labelSentiment, label the sentiments of the cleaned data
 *      in a new property called "sentiment".
 *      Add objects containing the sentiments for each app into an array.
 * @param {Object} cleaned - the cleaned csv data
 * @returns {{app_name: string, positive: number, neutral: number, negative: number}[]} - An array of objects, each summarizing sentiment counts for an app
 */
function sentimentAnalysisApp(cleaned) {
    const withSentiment = cleaned.map(({ rating, ...rest }) => ({
        ...rest,
        sentiment: labelSentiment({ rating }),
    }));

    const appSentiments = {};

    withSentiment.forEach(({ app_name, sentiment }) => {
        if (!appSentiments[app_name]) {
            appSentiments[app_name] = {
                app_name,
                positive: 0,
                neutral: 0,
                negative: 0,
            };
        }

        appSentiments[app_name][sentiment]++;
    });

    return Object.values(appSentiments);
}

/**
 * [TODO] Step 3: Sentiment Analysis by Language
 *      Using the previous labelSentiment, label the sentiments of the cleaned data
 *      in a new property called "sentiment".
 *      Add objects containing the sentiments for each language into an array.
 * @param {Object} cleaned - the cleaned csv data
 * @returns {{review_language: string, positive: number, neutral: number, negative: number}[]} - An array of objects, each summarizing sentiment counts for a language
 */
function sentimentAnalysisLang(cleaned) {
    const withSentiment = cleaned.map(({ rating, ...rest }) => ({
        ...rest,
        sentiment: labelSentiment({ rating }),
    }));

    const langSentiments = {};

    withSentiment.forEach(({ review_language, sentiment }) => {
        if (!langSentiments[review_language]) {
            langSentiments[review_language] = {
                review_language,
                positive: 0,
                neutral: 0,
                negative: 0,
            };
        }

        langSentiments[review_language][sentiment]++;
    });

    return Object.values(langSentiments);
}

/**
 * [TODO] Step 4: Statistical Analysis
 *      Answer the following questions:
 *
 *      What is the most reviewed app in this dataset, and how many reviews does it have?
 *
 *      For the most reviewed app, what is the most commonly used device?
 *
 *      For the most reviewed app, what the average star rating (out of 5.0)?
 *
 *      Add the answers to a returned object, with the format specified below.
 * @param {Object} cleaned - the cleaned csv data
 * @returns {{mostReviewedApp: string, mostReviews: number, mostUsedDevice: String, mostDevices: number, avgRating: float}} -
 *          the object containing the answers to the desired summary statistics, in this specific format.
 */
function summaryStatistics(cleaned) {
    const appCounts = {};
    cleaned.forEach(({ app_name }) => {
        appCounts[app_name] = (appCounts[app_name] || 0) + 1;
    });

    let mostReviewedApp = '';
    let mostReviews = 0;
    for (const [appName, count] of Object.entries(appCounts)) {
        if (count > mostReviews) {
            mostReviews = count;
            mostReviewedApp = appName;
        }
    }

    const mostReviewedAppReviews = cleaned.filter(
        ({ app_name }) => app_name === mostReviewedApp,
    );

    const deviceCounts = {};
    mostReviewedAppReviews.forEach(({ device_type }) => {
        deviceCounts[device_type] = (deviceCounts[device_type] || 0) + 1;
    });

    let mostUsedDevice = '';
    let mostDevices = 0;
    for (const [device, count] of Object.entries(deviceCounts)) {
        if (count > mostDevices) {
            mostDevices = count;
            mostUsedDevice = device;
        }
    }

    const totalRating = mostReviewedAppReviews.reduce(
        (sum, { rating }) => sum + rating,
        0,
    );
    const avgRating = totalRating / mostReviews;

    return {
        mostReviewedApp,
        mostReviews,
        mostUsedDevice,
        mostDevices,
        avgRating,
    };
}

/**
 * Do NOT modify this section!
 */
module.exports = {
    parseData,
    cleanData,
    sentimentAnalysisApp,
    sentimentAnalysisLang,
    summaryStatistics,
    labelSentiment,
};
