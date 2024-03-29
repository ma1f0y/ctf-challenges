const db=require('./db')
const flag=process.env.FLAG || 'fake{flag}'

module.exports.products=async function(req,res){
            pr=await db.all_products();
            res.json(pr)
}

module.exports.cart=async function(req,res){
            //console.log(req.body);
            if(!req.body.pid){
                res.json({message:"invalid prameters"})
                res.end();
                return;
            }
            const query="INSERT INTO cart (usr_id,pid,BUY) VALUES (?,?,?)";
            DB=db.db;
            let row= await db.data(req.session.user);
            cart_now=row[1]
            if(cart_now.some(e =>e.pid==req.body.pid)){
                res.json({message:"product already added"});
                res.end()
                return;
            }
            let product= await db.all_products;
            //console.log(product)
            //console.log(row);
                params=[row[0].id,req.body.pid,0]
                DB.run(query,params, function(err) {
                    if (err) {
                        console.log(err);
                        res.json({message:'error while updating db'})
                        res.end();
                        return;
                    }
                    res.json({message:"product added to cart"})
                });
    
}  

module.exports.buy=async function(req,res){
    if(!req.body.pid){
        res.json({message:"invalid prameters"})
        res.end();
        return;
    }
    
    let user= await db.data(req.session.user);
    let product= await db.getall("SELECT * FROM products WHERE  pid=?",[req.body.pid])
   // console.log("[+]product",)
    if(user[0].coins>=product[0].price||product[0].pid===1){
        const query="UPDATE cart SET buy=? WHERE pid=? AND usr_id=?";
        const query2='UPDATE users SET coins=? WHERE id=?'
        balance=user[0].coins-product[0].price
        balance= (balance<0) ? 0 :balance;
        params=[1,req.body.pid,user[0].id];
        try {
            await db.run(query,params);
            await db.run(query2,[balance,user[0].id])
            res.json({message:"product buyed"})
        } catch (error) {
            console.log(err)
            res.json({message:"cannot buy product"})
            res.end()
            return;
        }   
    }else{
        res.json({message:"you have not enough money"})
    }
}

module.exports.show_cart=async(req,res)=>{
    let row1= await db.data(req.session.user);
    const query='SELECT pid,buy FROM cart WHERE usr_id=?';
    params=[row1[0].id];
    const all= await db.all_products()
    let cart_products=[]
    db.db.all(query,params,(err,row)=>{
        if(err){
            res.json({message:"database error"})
            return;
        }  
        row.forEach(element => {
            all[element.pid-1].buy=element.buy
            //console.log(all[element.pid-1])
            cart_products.push(all[element.pid-1])
        });
        res.json(cart_products)
    });
}

module.exports.user=async(req,res)=>{
    let row= await db.data(req.session.user);
    row=row[0];
    delete row.password;
    res.json([row]);
}

module.exports.open=async(req,res)=>{
    flags={
        1:flag,
        2 :"not the flag"
    }
    
    //console.log(cart,product_id)
    try {
        let product_id=parseInt(req.body.pid);
        let row= await db.data(req.session.user);
        let cart=row[1];
        cart.forEach(el=>{
            //console.log(el.pid)
            if(el.pid===product_id){
                if(el.buy===1){
                    res.json({message:flags[el.pid]});
                    res.end();
                    throw "sucess";
                }
            }
            if(el==cart[cart.length-1]) throw "error";
        });
    } catch (error) {
        console.log(error);
        if(error==="error") res.json({message:"cannot open this product"});
        return;
    }

}