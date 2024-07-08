
const express = require("express");
const bodyParser = require("body-parser");
// requiring the mongoose
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();
//Tells our app to use ejs as our view engine
//And it app must be set just after express()
app.set("view engine", "ejs");

//Setting up the bodyParser before you can use the body set up in the post request** 
app.use(bodyParser.urlencoded({extended: true}));

app.use(express.static("public"));

//Creating a new data base inside mongodb
mongoose.connect("mongodb://localhost:27017/todlistDB");

//Creating a mongoose Schema
const itemsSchema = {
    name: String
};

//Creating a mongoose Model
const Item = mongoose.model("Item", itemsSchema);

//Creating new item model

const item1 = new Item ({
    name: "Welcome to your todo list"
});

const item2 = new Item ({
    name: "Hit the + button to add a new item"
});
const item3 = new Item ({
    name: "<-- Hit this to delete an item."
});


//This is our defaultItem list i.e the item that appears by default on all the todo list template
const defaultItems = [item1, item2, item3];

//Creating a list Schema
const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);



app.get("/", function(req, res){
    async function logAllItems() {
        try {
            const allItems = await Item.find();
            if (allItems.length === 0) {
                Item.insertMany(defaultItems)
                    .then(() => console.log("Successfully inserted all the list into the listDB"))
                    .catch((err) => { console.log(err); });
                res.redirect("/");
            } else {
                res.render("list", { listTitle: "Today", newListItems: allItems });
            }
        } catch (error) {
            console.error("Error", error);
        }
    }
    logAllItems();
});

//Creating a cutom list name to handle the different routs
app.get("/:customListName", function(req, res){
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({ name: customListName }).exec()
        .then(foundList => {
            if (!foundList) {
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                return list.save()
                    .then(() => res.redirect("/" + customListName))
                    .catch(err => {
                        console.error(err);
                        res.status(500).send("Error occurred while creating a new list.");
                    });
            } else {
                res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
            }
        })
        .catch(err => {
            console.error(err);
            res.status(500).send("Error occurred while finding the list.");
        });
});
   






//This handles the post request to the home route *
app.post("/", function(req, res){
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName
    });

    if(listName === "Today"){
        item.save();
        res.redirect("/");
    }else {
        List.findOne({name: listName}, ).then((foundList) => {
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        }).catch(err => {
            //Handle errors here
            console.error(err);
            res.redirect("/")
            
        });


    }
    
//Appending our items to our item using the .push  method
    
//Redirecting to the home route. When a post request is triggered on our home route, we save the value of the new item inside the text box, to a variable called ITEM and it will redirect to the home route and triggers the app.get for our home route and it will res.render the "list" template passing in everything in the curely braces 
    
});

 // Creating a new post rout to handle the delete
 app.post("/delete", function(req, res){
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today") {
        Item.findByIdAndDelete(checkedItemId)
            .then(() => {
                console.log("Successfully deleted item");
                res.redirect("/");
            })
            .catch((err) => {
                console.log(err);
                res.status(500).send("Error occurred while deleting the item.");
            });
    } else {
        List.findOneAndUpdate(
            { name: listName },
            { $pull: { items: { _id: checkedItemId } } }
        ).then(() => {
            res.redirect("/" + listName);
        }).catch((err) => {
            console.log(err);
            res.status(500).send("Error occurred while deleting the item.");
        });
    }
});





app.listen(3000, function(){
    console.log("server started on port 3000")
});