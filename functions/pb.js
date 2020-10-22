const axios = require('axios');
const GtfsRealtimeBindings = require('gtfs-realtime-bindings');
require('dotenv').config();

exports.handler = async (event, context) => {
    // Prepare fake GTFS
    const fakeFeedHeader = new GtfsRealtimeBindings.transit_realtime.FeedHeader({
        gtfsRealtimeVersion: '2.0',
        timestamp: 1603138499,
    });
    const fakeFeed = new GtfsRealtimeBindings.transit_realtime.FeedMessage({
        header: fakeFeedHeader
    });
    let finalFeed = fakeFeed;

    // Make request to STM server
    axios.request({
        url: 'vehiclePositions',
        baseURL: 'https://api.stm.info/pub/od/gtfs-rt/ic/v1/',
        method: 'post',
        headers: {
            'apikey': process.env.STM_API_KEY,
        },
        timeout: 6000,
    })
        .then(response => {
            if (response.status !== 200) {
                console.log('Got a response, but ', response.status);
                return;
            }
            try {
                const realFeed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(response.data);
                if (realFeed.header.timestamp > (Math.floor(Date.now() / 1000) - 300)) {
                    finalFeed = realFeed;
                    console.log('The feed is up to date!');
                }
            } catch (error) {
                console.log('Oops! Something went wrong.', error);
            }
        })
        .catch(error => {
            console.log('Error while trying to fetch the feed.', error.message);
        });

    return {
        statusCode: 200,
        body: finalFeed,
    };
}
