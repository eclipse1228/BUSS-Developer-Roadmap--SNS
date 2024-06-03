const postSchema = new mongoose.Schema({
    category: { type: String},
    title: { type: String, required: true },
    content: { type: String, required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    images: [{ type : String }],
    comments: [{ 
      user: { type: Schema.Types.ObjectId, ref: 'User' },
      comment: { type: String, required: true },
      createdAt: { type: Date, default: Date.now }
    }]
  });
// 게시글 작성에 필요한 게시글 객체를 만들고 있다.
// 몽고디비에 저장할것이다.



  