const pool = require('../pool');

const uploadFileToGCS = (req, res, next) => {
    if (req.file && req.file.gcsUrl) {
      return res.status(200).json({
        error: false,
        message: 'File uploaded successfully to GCS',
        gcsUrl: req.file.gcsUrl
      });
    }

    return res.status(500).json({
      error: true,
      message: 'Unable to upload'
    });
}

const getTrendingCampaigns = (request, response) => {
    try {
      const queryString = `
          SELECT * FROM campaigns
          LEFT JOIN ( SELECT id_campaign, array_agg(id_category) as categories FROM category_campaign GROUP BY id_campaign) AS a
          ON campaigns.id = a.id_campaign
          LEFT JOIN ( SELECT id_campaign, COUNT(id_user) as participant_count FROM campaign_participant GROUP BY id_campaign) AS b
          ON campaigns.id = b.id_campaign
          ORDER BY id;
      `;
      pool.query(queryString, (error, results) => {
        if (error) throw error;
        response.status(200).json({
            error: false,
            message: "Trending campaigns fetched successfully",
            campaigns: results.rows.map(data => ({
              id: data.id,
              posterUrl: data.poster_url,
              title: data.title,
              description: data.description
          }))
        });
      })
    }
    catch (error) {
      response.status(error.code || 400).json({
        error: true, message: error.message
      });
    }
};

module.exports = {
    uploadFileToGCS,
    getTrendingCampaigns
}