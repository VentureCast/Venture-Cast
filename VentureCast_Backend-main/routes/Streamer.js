const express = require('express');
const router = express.Router();
const YouTubeStreamer = require('../models/Youtubestremer')
const YouTubeVideo =  require('../models/YoutubeVideo')
const Streamer = require('../models/Streamer'); 
const TwitchVideo = require('../models/twitchVideo');
const { google } = require('googleapis');
const { default: axios } = require('axios');

require('dotenv').config();

const youtubeApiKey = process.env.YOUTUBE_API_KEY;
const youtube = google.youtube('v3');

async function fetchYouTubeData(channelId) {
  try {
    const response = await youtube.channels.list({
      key: youtubeApiKey,
      id: channelId,
      part: 'snippet,statistics'
    });

    if (response.data.items && response.data.items.length > 0) {
      const data = response.data.items[0];
      return {
        platform: 'YouTube Gaming',
        streamer: data.snippet.title,
        subscriberCount: data.statistics.subscriberCount,
        category: data.snippet.title, 
      };
    } else {
      console.log(`No data found for channel ID: ${channelId}`);
      return null;
    }
  } catch (error) {
    console.error('Error fetching YouTube data:', error);
  }
}

async function fetchYouTubeDataByUsername(channelName) {
  try {
    const response = await youtube.search.list({
      key: youtubeApiKey,
      q: channelName,
      type: 'channel',
      part: 'snippet'
    });

    if (response.data.items && response.data.items.length > 0) {
      const channelId = response.data.items[0].id.channelId;
      return await fetchYouTubeData(channelId);
    } else {
      console.log(`No channel found with name: ${channelName}`);
      return null;
    }
  } catch (error) {
    console.error('Error fetching YouTube data by username:', error);
  }
}

async function storeYouTubeData(data) {
  try {
    const newStreamer = new YouTubeStreamer(data);
    await newStreamer.save();
    console.log(`Data saved for streamer: ${data.streamer}`);
  } catch (error) {
    console.error('Error storing data in MongoDB:', error);
  }
}
  

router.post("/subscribercount", async (req, res) => {
  const { channelName } = req.body;

  if (!channelName) {
    return res.status(400).json({ error: 'Channel name is required.' });
  }

  try {
    const youtubeData = await fetchYouTubeDataByUsername(channelName);
    if (youtubeData) {
      await storeYouTubeData(youtubeData);
      res.status(200).json({
        message: `Data saved for channel: ${youtubeData.streamer}`,
        data: youtubeData
      });
    } else {
      res.status(404).json({ error: 'Channel not found or no data available.' });
    }
  } catch (error) {
    console.error('Error in /subscribercount endpoint:', error);
    res.status(500).json({ error: 'Failed to fetch or save data.' });
  }
});

async function getUploadPlaylistIdByChannelId(channelId) {
  try {
    const response = await youtube.channels.list({
      key: youtubeApiKey,
      id: channelId,
      part: 'contentDetails'
    });

    if (response.data.items && response.data.items.length > 0) {
      return response.data.items[0].contentDetails.relatedPlaylists.uploads;
    } else {
      throw new Error(`No data found for channel ID: ${channelId}`);
    }
  } catch (error) {
    console.error(`Error getting playlist ID for channel ID ${channelId}:`, error);
    throw error;
  }
}

// Function to fetch videos from a playlist, handling pagination
async function getVideosFromPlaylist(playlistId) {
  let videos = [];
  let nextPageToken = '';

  do {
    const response = await youtube.playlistItems.list({
      key: youtubeApiKey,
      playlistId,
      part: 'snippet',
      maxResults: 50,
      pageToken: nextPageToken
    });

    if (response.data.items && response.data.items.length > 0) {
      videos = videos.concat(
        response.data.items.map(item => ({
          title: item.snippet.title,
          videoId: item.snippet.resourceId.videoId,
          publishedAt: item.snippet.publishedAt,
          description: item.snippet.description,
        }))
      );
    }

    nextPageToken = response.data.nextPageToken;
  } while (nextPageToken);

  return videos;
}

// Function to fetch statistics for a specific video ID
async function getVideoStatistics(videoId) {
  try {
    const response = await youtube.videos.list({
      key: youtubeApiKey,
      id: videoId,
      part: 'statistics'
    });

    if (response.data.items && response.data.items.length > 0) {
      const stats = response.data.items[0].statistics;
      return {
        viewCount: parseInt(stats.viewCount, 10),
        likeCount: parseInt(stats.likeCount, 10),
      };
    } else {
      return { viewCount: 0, likeCount: 0 };
    }
  } catch (error) {
    console.error(`Error fetching statistics for video ID ${videoId}:`, error);
    return { viewCount: 0, likeCount: 0 };
  }
}

// Function to store video data in MongoDB
async function storeVideoData(videoData) {
  try {
    const newVideo = new YouTubeVideo(videoData);
    await newVideo.save();
    console.log(`Stored data for video: ${videoData.title}`);
  } catch (error) {
    console.error('Error storing video data:', error);
  }
}

// Endpoint to fetch and save video list with statistics
router.post('/videolist', async (req, res) => {
  const { channelId, username } = req.body;

  if (!channelId && !username) {
    return res.status(400).json({ error: 'Channel ID or username is required.' });
  }

  try {
    let playlistId;

    // Fetch playlist ID based on channel ID or username
    if (channelId) {
      playlistId = await getUploadPlaylistIdByChannelId(channelId);
    } else {
      // Use a username to find channel ID first, then get playlist ID
      const response = await youtube.search.list({
        key: youtubeApiKey,
        q: username,
        type: 'channel',
        part: 'snippet'
      });

      if (response.data.items && response.data.items.length > 0) {
        const foundChannelId = response.data.items[0].id.channelId;
        playlistId = await getUploadPlaylistIdByChannelId(foundChannelId);
      } else {
        throw new Error(`No channel found with name: ${username}`);
      }
    }

    // Fetch videos from playlist and save data
    const videos = await getVideosFromPlaylist(playlistId);
    const savedVideos = [];

    // Limit to saving the first 10 videos
    const maxVideosToSave = 10;
    for (let i = 0; i < Math.min(maxVideosToSave, videos.length); i++) {
      const video = videos[i];
      const stats = await getVideoStatistics(video.videoId);
      const videoData = { ...video, ...stats };
      await storeVideoData(videoData); 
      savedVideos.push(videoData);
    }

    return res.status(200).json({
      message: `Stored ${savedVideos.length} videos in MongoDB.`,
      data: savedVideos
    });
  } catch (error) {
    console.error('Error in /videolist endpoint:', error);
    return res.status(500).json({ error: 'Failed to fetch or save video data.' });
  }
});



const { TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET } = process.env;


async function getTwitchToken() {
  try {
    const response = await axios.post('https://id.twitch.tv/oauth2/token', null, {
      params: {
        client_id: TWITCH_CLIENT_ID,
        client_secret: TWITCH_CLIENT_SECRET,
        grant_type: 'client_credentials',
      },
    });
    return response.data.access_token;
  } catch (error) {
    console.error("Error fetching Twitch token:", error.message);
    throw error;
  }
}

// Get streamer details by name
async function getStreamerDetails(token, username) {
  try {
    const response = await axios.get(`https://api.twitch.tv/helix/users`, {
      headers: {
        'Client-ID': TWITCH_CLIENT_ID,
        'Authorization': `Bearer ${token}`
      },
      params: { login: username }
    });

    const user = response.data.data[0];
    if (user) {
      return {
        id: user.id,
        name: user.display_name,
        description: user.description,
        profileImageUrl: user.profile_image_url,
        // followerCount: await getFollowerCount(token, user.id) // Get followers
      };
    } else {
      throw new Error(`No streamer found with name: ${username}`);
    }
  } catch (error) {
    console.error("Error fetching streamer details:", error.message);
    throw error;
  }
}

// Get videos by streamer ID
async function getStreamerVideos(token, userId) {
  try {
    const response = await axios.get(`https://api.twitch.tv/helix/videos`, {
      headers: {
        'Client-ID': TWITCH_CLIENT_ID,
        'Authorization': `Bearer ${token}`
      },
      params: { user_id: userId, first: 10 } // Fetch first 10 videos
    });

    return response.data.data.map(video => ({
      title: video.title,
      description: video.description,
      publishedAt: video.created_at,
      viewCount: video.view_count,
      url: video.url
    }));
  } catch (error) {
    console.error("Error fetching streamer videos:", error.message);
    throw error;
  }
}

// Store streamer data in MongoDB
async function storeStreamerData(streamerData) {

  try {

    const existingStreamer = await Streamer.findOne({ id: streamerData.id });

    if (existingStreamer) {
      // If the streamer exists, update the existing document
      existingStreamer.streamerName = streamerData.name;
      existingStreamer.description = streamerData.description;
      existingStreamer.profileImageUrl = streamerData.profileImageUrl;
      await existingStreamer.save();
      console.log(`Updated streamer data for: ${streamerData.name}`);
    } else {
      // If the streamer doesn't exist, create a new document
      const newStreamer = new Streamer(streamerData);
      await newStreamer.save();
      console.log(`Stored new streamer: ${streamerData.name}`);
    }
  } catch (error) {
    console.error("Error storing streamer data:", error);
  }
}


async function storeVideoData(videos, streamerId,streamerName) {
  for (const video of videos) {
    try {
      const newVideo = new TwitchVideo({ ...video, streamerId, streamerName });
      await newVideo.save();
      console.log(`Stored video: ${video.title}`);
    } catch (error) {
      console.error("Error storing video data:", error);
    }
  }
}


router.post('/twitch/videos', async (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: 'Streamer username is required.' });
  }

  try {
    const token = await getTwitchToken();
    const streamerDetails = await getStreamerDetails(token, username);
    const videos = await getStreamerVideos(token, streamerDetails.id);

    // Store streamer and video data in MongoDB
    await storeStreamerData(streamerDetails);
    await storeVideoData(videos, streamerDetails.id, streamerDetails.name);

    return res.status(200).json({
      message: `Stored ${videos.length} videos for ${streamerDetails.name} in MongoDB.`,
      streamer: streamerDetails,
      videos
    });
  } catch (error) {
    console.error('Error in /twitch/videos endpoint:', error);
    return res.status(500).json({ error: 'Failed to fetch or save data.' });
  }
});

  module.exports = router;