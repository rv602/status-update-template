// let groupedByCategory;
// let oTimezonesGroupedByGMT;
// let oTimeZonesByName;
// let oTimeZones = [];

// function processTimezoneData(oTimezoneData) {
//     oTimeZones = oTimezoneData;
//     let oPopularTimeZones = [];
//     for (let i = 0; i < oTimeZones.length; i++) {
//         let oTimeZone = oTimeZones[i];
//         if (oTimeZone.popular === '1') {
//             let oPopularTimeZone = JSON.parse(JSON.stringify(oTimeZone));
//             oPopularTimeZone.category = 'Popular Timezone';
//             oPopularTimeZones.push(oPopularTimeZone);
//         }
//     }
//     oTimeZones = oTimeZones.concat(oPopularTimeZones);
//     groupedByCategory = groupBy(oTimeZones, 'category', {});
//     oTimezonesGroupedByGMT = groupBy(oTimeZones, 'gmt', {});
//     oTimeZonesByName = groupBy(oTimeZones, 'timezone_name', {});

//     Object.keys(groupedByCategory).forEach(key => {
//         groupedByCategory[key].sort(function(timeZone1, timeZone2) {
//             var timeZone1GTM = timeZone1.gmt.toUpperCase(); // ignore upper and lowercase
//             var timeZone2GTM = timeZone2.gmt.toUpperCase(); // ignore upper and lowercase
//             if ((timeZone1GTM.includes('+') && timeZone2GTM.includes('-')) || timeZone1GTM > timeZone2GTM) {
//                 return 1;
//             }
//             if ((timeZone1GTM.includes('-') && timeZone2GTM.includes('+')) || timeZone1GTM < timeZone2GTM) {
//                 return -1;
//             }
//             return 0;
//         });
//     });
// }

// function checkAndGetCorrectTz(sGMTValue) {
//     let guessedTZ = moment.tz.guess();
//     sGMTValue = sGMTValue || getSystemTimeZoneinGMT();
//     if (oTimezonesGroupedByGMT && oTimezonesGroupedByGMT[sGMTValue] && oTimezonesGroupedByGMT[sGMTValue].length) {
//         let arrMatchingTimezones = oTimezonesGroupedByGMT[sGMTValue];
//         if (arrMatchingTimezones) {
//             let normalizedTz = arrMatchingTimezones[0].timezone_name;
//             let maxPopulation = moment().tz(normalizedTz)._z.population;
//             arrMatchingTimezones.forEach(oTimeZone => {
//                 let momentTz = moment().tz(oTimeZone.timezone_name);
//                 if (guessedTZ === oTimeZone.timezone_name) {
//                     normalizedTz = guessedTZ;
//                     return false;
//                 } else if (maxPopulation <= momentTz._z.population) {
//                     maxPopulation = momentTz._z.population;
//                     normalizedTz = oTimeZone.timezone_name;
//                 }
//             });
//             return normalizedTz;
//         }
//     }
//     return sGMTValue;
// }

// function getSystemTimezone() {
//     let { preferences } = userPreferencesRes;
//     let presenceOfScheduleDefaultTimezone = checkPresenceOfPropertyInObject(preferences, 'U_DEFAULT_ESCH_TIMEZONE');
//     if (presenceOfScheduleDefaultTimezone) {
//         preferences.U_DEFAULT_ESCH_TIMEZONE = checkAndGetCorrectTz(preferences.U_DEFAULT_ESCH_TIMEZONE);
//         return preferences.U_DEFAULT_ESCH_TIMEZONE;
//     }
//     let initZone = checkAndGetCorrectTz();
//     return initZone;
// }

// function getSystemTimeZoneinGMT() {
//     let today = new Date().toString();
//     try {
//         if (today && today.split(' ')[5]) {
//             let GMTString = today.split(' ')[5];
//             GMTString = GMTString.slice(0, 6) + ':' + GMTString.slice(6);
//             return GMTString;
//         }
//     } catch (e) {
//         console.log("Failed to get user's timezone");
//     }
//     return 'GMT+00:00';
// }

// var groupBy = function(array, key, initialValue) {
//     return array.reduce(function(rv, x) {
//         (rv[x[key]] = rv[x[key]] || []).push(x);
//         return rv;
//     }, initialValue);
// };
