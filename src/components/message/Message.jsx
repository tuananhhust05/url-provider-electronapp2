import "./message.css";
import { format } from "timeago.js";  // config thời gian cho tin nhắn 
import {useState, useContext,useEffect} from "react";
import axios from 'axios';
import { AuthContext } from "../../context/AuthContext"// để lấy dữ liệu user 
// truyền vào tin nhắn và thông tin sở hữu của tin nhắn là bạn hay hay người nói chuyện với bạn 
// true false và được css 
// chỉ cần click vào 1 thằng thì sẽ hiện ra thông tin chat của mình với 1 đối tượng, đơn giản vậy thôi 

export default function Message({ listMes,setListMes,memberMes,socketServer,message, own }) {
  const { user } = useContext(AuthContext); // lấy thằng user đang xem tin nhắn này 
  const [deleteMesBut,setDeleteMesBut]=useState(false);
  const [nameSender,setNameSender]=useState("Tuấn anh")
  // lấy tên người gửi
  useEffect(() => {
    const getNameSender= async()=>{ //get("/getuser/:id"
      const res = await axios.get("/users/getuser/"+message.sender)
      console.log(res.data);
      console.log(message.sender);
      setNameSender(res.data[0].username);
    }
    getNameSender();
  },[])

  const hadleDeleteMessage=async(value)=>{
    alert("Delete Mes");
    setDeleteMesBut(false);
    // call api xóa tin nhắn trong db bằng id tin nhắn 
    const res = await axios.get('/messages/delete/'+ message._id)
    console.log(res.data); // lấy được dữ liệu của tin nhắn vừa xóa 
    alert("xóa thành công");
    // giờ emit tin nhắn vừa xóa lên để check id nếu trùng nhau thì không set ArrivalMes
    
   
    // lấy dữ liệu reciveId 
    const receiverId =  memberMes.filter(
      (member) => member !== user._id 
    );

    socketServer.current.emit( "sendMessage",{
     senderId: res.data.sender,
     receiverId:receiverId,
     text:res.data.text,
     idConversation:message.conversationId,
     idmes: message._id }
    );

    // set lại list tin nhắn của chính user xóa
    const new_arr = listMes.filter(item => item._id !== res.data._id); // lấy ra những item khác với thằng vừa xóa
    setListMes(new_arr);
  }
  return (
    <div className={own ? "message own" : "message"}>
      <div onClick={()=>setDeleteMesBut(true)} className="messageTop">
        <img
          className="messageImg"
          src="https://messenger-api-express.herokuapp.com/images/person/noAvatar.png"
          alt=""
        />{/*Hình anh mặc định*/}
        <p style={{position:"relative",marginTop:"-20px"}}>{nameSender}</p>
        { message.text.substring(0, 7) === "images/" ?
             message.text.substring(message.text.length - 3, message.text.length) === 'pdf'?
             <embed src={`http://localhost:5000/${message.text}`}  width="600" height="300" type="application/pdf"></embed>
              :
              message.text.substring(message.text.length - 4, message.text.length) === 'jpeg'?
              <img
              style={{ maxWidth: '200px' }}
              src={`http://localhost:5000/${message.text}`}
              alt="img"
              />
                :
                message.text.substring(message.text.length - 3, message.text.length) === 'png'?
                <img
                style={{ maxWidth: '200px' }}
                src={`http://localhost:5000/${message.text}`}
                alt="img"
                />
                  :
                    message.text.substring(message.text.length - 3, message.text.length) === 'jpg'?
                      <img
                      style={{ maxWidth: '200px' }}
                      src={`http://localhost:5000/${message.text}`}
                      alt="img"
                      />
                        :
                        message.text.substring(message.text.length - 3, message.text.length) === 'mp4'?
                            <video
                            style={{ maxWidth: '200px' }}
                            src={`http://localhost:5000/${message.text}`} alt="video"
                            type="video/mp4" controls
                            />
                            :
                            <div style={{boxShadow:"2px 2px 2px black",borderRadius:"3px"}}>
                              <p>{message.text.substring(8, message.text.length)}</p>
                              <a style={{cursor:'pointer'}} href={`http://localhost:5000/${message.text}`}>
                                  <button style={{borderRadius:"2px"}}>Download</button>
                              </a>
                            </div>
          :
          <p className="messageText">{message.text}</p>
          }
         <div onClick={()=>hadleDeleteMessage(false)}>
        {
          deleteMesBut?
          (
               <i style={{zIndex:2,boxShadow:"2px 2px 2px black",borderRadius:"50%",width:"15px",height:"15px"}} class="fa-solid fa-xmark"></i>
          ):
          (
            <div></div>
          )
        }
         </div>
      </div>
      <div className="messageBottom">{format(message.createdAt)}</div>
     
    </div>
  );
}