import axios from "axios";
import { useEffect, useState,useContext } from "react";
import "./conversation.css";
import { AuthContext } from "../../context/AuthContext"// để lấy dữ liệu user 
export default function Conversation({ conversation, currentUser,convSearch, conSetup,setConSetup, socketServer }) {
  const { user } = useContext(AuthContext);
  const [userLocal, setUserLocal] = useState(""); // user cục bộ 
  // ở dưới để dấu chấm hỏi để có thể có hoặc không có trường đối với 1 object => chống null lúc đầu
  const PF = "https://messenger-api-express.herokuapp.com/images/";
  
   

 // lấy thông tin thằng user còn lại trong đoạn chat thông qua id của nó 
 useEffect(() => {
  const friendIdarray = conversation.members.filter((m) => { if(m !== currentUser._id) return m});  // lọc  ra những id khác id user
  // bây giờ ta sẽ tạo ra 1 cái api trả về thẳng chuỗi cho thằng ui  bằng cách đưa lên 1 conversation 
  const getUser = async (iduserArray) => {
    try {
      const res = await axios.post("/conversations/getConversationName",{iduserArray});
      setUserLocal(res.data);
    } catch (err) {
      console.log(err);
    }
  };
  
  getUser(friendIdarray);
  
 
}, [currentUser, conversation]);

const handleDeleteCon= async()=>{
  
  alert("Do you want to delete this conversation");
  //xóa trong api
   try {
      const res = await axios.get(`/conversations/delete/${conversation._id}`);
      // xóa ở local; lấy thông tin ở component cha truyền vào:
      const new_arr = conSetup.filter(item => item._id !== res.data._id); // lấy ra những item khác với thằng vừa xóa
      setConSetup(new_arr);
      //emit đến kênh tạo chat chính ông conversation vừa tạo 
      const receiverId = conversation.members.filter(
        (member) => member !== user._id 
      );
     
      socketServer.current.emit("deleteCoversation",{
           _id:conversation._id,
           senderId: user._id,  // chính ông emit data 
           receiver: receiverId    // lọc ra 
         }
       );
    } catch (err) {
      console.log(err);
    }
}
  // lấy xong thông tin về thằng conf lại thì tiến hành hiển thị 
  return (
    <div className="conversation">
      {/*Đường link ảnh truy cập lên server*/}
      {/*set chuyển màu*/}
      {
        (userLocal.includes(convSearch))?(
          <div className="conversation_child">
            <div onClick={()=>handleDeleteCon()} className="menu_edit_conv">
              Delete
            </div>
            <div style={{fontSize:"12px"}}>
              {conversation.createdAt}
            </div>
            <img
              className="conversationImg"
              src={
                   PF + "person/noAvatar.png"
              }
              alt=""
            />
            <span style={(conversation.status)?{color:'red'}:{}} className="conversationName">{userLocal}</span>
          </div>
        ):(
          <span></span>
        )
      }
      </div>
  );
}