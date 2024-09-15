const mongoose = require('mongoose');

const URI = 'mongodb+srv://salaoUser:senhaUser@clusterdev.yebgb.mongodb.net/jade-hairstyles?retryWrites=true&w=majority&appName=ClusterDev';

mongoose
    .connect(URI)
    .then(() => console.log('DB is Up!'))
    .catch(() => console.log(err));
