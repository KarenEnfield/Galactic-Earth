import express from 'express';
import { MongoDBNamespace } from 'mongodb';
//import bodyParser from 'body-parser';         // deleted for deprecation
import { MongoClient } from 'mongodb';
import path from 'path';

const app = express();

app.use(express.static(path.join(__dirname, '/build')));
//app.use(bodyParser.json());                   // deleted for deprecation
app.use(express.urlencoded({extended:true}));   // replaces bodyParser 
app.use(express.json());                        // replaces bodyParser 

const withDB = async (operations, res) => {

    try {
        
        const client = await MongoClient.connect('mongodb://localhost:27017', { useNewUrlParser:true});
        const db = client.db('galactic-earth');
        
        await operations(db);
        
        client.close();
    } catch (error) {
            res.status(500).json({ message: 'Error connecting to db!',error });
    }

}

app.get('/api/articles/:name', async (req,res) => {
    
    withDB(async (db) => {
        const articleName = req.params.name;
    
        const articleInfo = await db.collection('articles').findOne({name: articleName});
    
        res.status(200).json(articleInfo);
    }, res);
    
});

app.post('/api/articles/:name/upvote', async (req,res) => {
    withDB(async (db) => {
        const articleName = req.params.name;

        const articleInfo = await db.collection ('articles').findOne({ name : articleName });
        await db.collection('articles').updateOne({ name : articleName }, {
            '$set' : {
                upvotes: articleInfo.upvotes + 1,
            },
        });  

        const updatedArticleInfo = await db.collection ('articles').findOne({ name : articleName });

        res.status(200).json(updatedArticleInfo);
    }, res);

});

app.post('/api/articles/:name/add-comment', async (req,res) => {
    

    withDB(async (db) => {
        
        const articleName = req.params.name;
        const { username, text } = req.body;

        const articleInfo = await db.collection('articles').findOne({ name : articleName });
        await db.collection('articles').updateOne({ name : articleName }, {
            '$set' :  {
                comments : articleInfo.comments.concat({ username, text }),
                
            },
        });
        const updatedArticleInfo = await db.collection('articles').findOne({ name : articleName });
        res.status(200).json(updatedArticleInfo);
    }, res);
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname + '/build/index.html'));
});

app.listen(8000, () => console.log('Listening on port 8000'));

