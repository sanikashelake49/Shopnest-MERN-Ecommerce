const Order=require('../model/Order');
const Product = require("../model/Product");

const sendEmail=require('../utils/sendEmail');

//create a new user
const createOrder=async(req,res)=>{
    try{
    const{items,totalAmount,address,paymentId}=req.body;
    if(!items||items.length===0||!totalAmount||!address){
        return res.status(400).json({message:'Invalid order data'});
    }
        else{

            // Reduce Product Stock

for (const item of items) {

    const product = await Product.findById(item.productId);

    if (!product) {
        return res.status(404).json({
            message: "Product not found"
        });
    }

    if (product.stock < item.qty) {
        return res.status(400).json({
            message: `${product.name} is out of stock`
        });
    }

    product.stock = product.stock - item.qty;

    await product.save();
}
            const order=new Order({
                user:req.user._id,
                items,
                totalAmount,
                address,
                paymentId
            });
            await order.save();
            const message=`Dear ${req.user.name},Thank you for your order!
             Your order has been successfully created with the following details:
             Order ID: ${order._id}
            Total Amount: $${totalAmount}
            Shipping Address: ${address}
            We will notify you once your order is shipped.
            Best regards,
            ShopNest Team`;

            await sendEmail(req.user.email,'Order Created',message);
            res.status(201).json({message:'Order created successfully',order});
        }
    }catch(error){
        res.status(500).json({message:'Error creating order',error});
    }
    };

    //user to see their orders
    const myOrders=async(req,res)=>{
        try{
            const orders=await Order.find({user:req.user._id}).populate('items.productId','name price');
            res.json(orders);
        }catch(error){
            res.status(500).json({message:'Error fetching orders',error});
        }
    };

    //for admin to find all orders
    const getOrders=async(req,res)=>{
        try{
            const orders = await Order.find({})
            .populate("user","name email")
             .populate("items.productId","name");
            res.json(orders);
        }catch(error){
            res.status(500).json({message:'Error fetching oredrs',error});
        }
    };

    const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name email")
      .populate("items.productId", "name price imageUrls");

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    res.json(order);

  } catch (error) {
    res.status(500).json({
      message: "Error fetching order",
      error: error.message,
    });
  }
};

    //status updation of user using id
    const updateOrderStatus=async(req,res)=>{
        try{
            const{status}=req.body;
            const order=await Order.findById(req.params.id);
            if(order){
                order.status=status;
                await order.save();
                res.json({message:'Order status updated',order});

            }else{
                res.status(404).json({message:'Order not found'});

            }
        }catch(error){
            res.status(500).json({message:'Error updating order status',error});

        }
    } ;

    module.exports={
        createOrder,
        myOrders,
        getOrders,
        getOrderById,
        updateOrderStatus,

    };

