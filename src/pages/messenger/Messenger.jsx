import { useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "../../context/AuthContext"// để lấy dữ liệu user 
import Topbar from "../../components/topbar/Topbar"
import Conversation from "../../components/conversations/Conversation"
import Message from "../../components/message/Message" // config các tin nhắn 
import ChatOnline from "../../components/chatOnline/ChatOnline" // danh sách những ông đang online  
import "./messenger.css"
import axios from "axios"
import { io } from "socket.io-client"   // import server 
import { useDropzone } from "react-dropzone"

// lưu ý hoạt động của set State trong re-render FE 
// không set lại giá trị khởi tạo 
// tránh những useEffect có điều kiện hoặc reference 
// việc re-render lại 1 ob không ảnh hưởng đến 1 object khác đã set 


export default function Messenger(){
  
    // phân quyền hiển thị user 
    // nếu là host thì hiển thị toàn bộ danh sách online 
    // nếu không là host thì chỉ hiển thị host mà thôi 
    let hostId=useRef(); 
    hostId='62c46ce6951a21183c402403';
    const [socketHost, setSocketHost] = useState({userId: '62c46ce6951a21183c402403', socketId: ''});  // lấy cả ra địa chỉ của socketHost để khi user click vào thì hiển thị luôn conversation đc tạo 
    // vậy câu hỏi đặt ra nếu add không online thì user click bằng cái gì 

   
    const { user } = useContext(AuthContext);  // lấy dữ liệu tài khoản 
    const [conversations, setConversations] = useState([]);  // conversationid biểu thị cho cuộc trò chuyện giũa hai người 
    // thằng này chứa 1 mảng gôm các id của conversation 
    const [currentChat, setCurrentChat] = useState(null); // set trạng thái chat,
    // lấy dữ liệu các cuộc trò chuyện trong db 
    const [messages, setMessages] = useState([]); // lấy danh sách các tin nhắn 

    const [newMessage, setNewMessage] = useState("") // nhập tin nhắn mới 
   
    const scrollRef = useRef(); // config cho tin nhắn mới sẽ hiện xuống dưới 
    // thằng cuộn này hoạt động khi ta có thêm tin nhắn; mảng tin nhắn thay đổi 
    // thằng này set ở mỗi tin nhắn 
   
    const [chatUsers, setChatUsers] = useState([]);  // lấy danh sách user
    

    // chộp tin nhắn vừa được gửi sau đó thêm vào list mesage ban đầu rồi render ra 
    // cách bình thường là phỉa reload page hoặc chỉ thấy tin nhắn của mình 
    const [arrivalMessage, setArrivalMessage] = useState(null);// lấy thông tin của tin nhắn vừa gửi 
    const [arrivalConversation, setArrivalConversation] = useState(null);

    const[searchCon,setSearchCon]=useState('')
    const socket = useRef(); // để tránh việc thay đổi socket id trong 1 phiên làm việc 
    
    // luôn lắng nghe 1 lần khi reload page 
    // sẽ hoạt động đếu bắt được tín hiệu từ server
    //https://socket-mes.herokuapp.com/
    useEffect(() => {  // lắng nghe tin nhắn được gửi tới socketid của nó từ server
      socket.current = io("https://socket-server-mes.herokuapp.com/"); // dùng ig... là kết nối rối 
      // trên thằng server cũng nhận được 1 object socket
      socket.current.on("getMessage", (data) => {
        
        const getMessages = async () => {
            const res = await axios.get("/messages/" + data.idConversation);  // current chat có thể rỗng vì ban đầu có thể chưa chọn 
            const test = res.data.filter(item => item._id === data.idmes); // lôi ra những thằng có id bằng id socket gửi 
            if(test.length===0){ // nếu không có đã xóa
              setMessages(res.data);      // set lại data ui từ data trong db
            }
            else{
              setArrivalMessage({
                sender: data.senderId,
                text: data.text,
                createdAt: Date.now(),
                conversationId:data.idConversation,
                _id:data.idmes
              });
            }
        };
        getMessages();
      
      });
      // lắng nghe liên tục bất chấp hook
      socket.current.on("getConversation", (data) => {
        console.log(data)
        const getCoversation = async () => {
          // call api lấy ra danh sách conversation ứng với id  
          const res = await axios.get("/conversations/" + user._id);
          const test = res.data.filter(item => item._id === data._id); // lôi ra những thằng có id bằng id socket gửi 
          if(test.length===0){ // nếu có đối tượng nào bằng => Đã xóa trong cơ sở dữ liệu
            setConversations(res.data); 
          }
          else{
            setArrivalConversation({  // thêm tin nhắn mới đến 
              _id:data._id,
              members:data.members,
              status:true,
              createdAt: Date.now(),
            });
          }
        }
        getCoversation(); // chú ý chỗ đặt 
      });
    }, []);


     // hàm sắp xếp conv 
    const sortCoversation =  ()=>{
      let new_conv_a=conversations;
      let new_conv2=[];
      let new_conv3=[];
      for(let i=0;i<new_conv_a.length;i++){
        if(new_conv_a[i].status){
          new_conv2.push(new_conv_a[i])
        }
        else if(!new_conv_a[i].status){
          new_conv3.push(new_conv_a[i])
        }
      }
      for(let i=0;i<new_conv3.length;i++){
        new_conv2.push(new_conv3[i])
      }
      return(new_conv2);
    }

    
    // thêm mesage ,conv; chỉnh conv lúc có mes mới 
    // thằng useEffect này khi chương trình bật nó sẽ chạy ít nhất 1 lần 
    // các tác vụ thực hiện nên đưa vào luông khi có dư liệu arrival
    useEffect(() => {
      // logic code: nếu arrivalMessage khác null( chỉ xét khi nó có sự thay đổi giá trị)
      // và trong thằng currenChat check được có tồn tại id sender của arrival thì nó thêm vào danh sách mesage và render lại 
      arrivalMessage &&
        currentChat?.members.includes(arrivalMessage.sender) &&
        setMessages((prev) => [...prev, arrivalMessage]);
      
      // có arrivalMassage thì cập nhật conversation theo id
      if(arrivalMessage){ 
        let new_conv=[];
        conversations.map((mem)=>{
          if(mem._id ==arrivalMessage.conversationId){
            mem.status=true;
          }
          new_conv.push(mem)
        })
        // có thời gian viết lại hàm sắp xếp
        let new_conv2=[]; //mới đến mặc định true
        let new_conv3=[];
        for(let i=0;i<new_conv.length;i++){
          if(new_conv[i].status){
            new_conv2.push(new_conv[i])
          }
          else if(!new_conv[i].status){
            new_conv3.push(new_conv[i])
          }
        }
        for(let i=0;i<new_conv3.length;i++){
          new_conv2.push(new_conv3[i])
        }
        setConversations(new_conv2);
      }
      
       

      if(arrivalConversation){
        if(arrivalConversation.members.includes(user._id)){
          let new_conv_a=conversations;
          let new_conv2=[arrivalConversation]; //mới đến mặc định true
          let new_conv3=[];
          for(let i=0;i<new_conv_a.length;i++){
            if(new_conv_a[i].status){
              new_conv2.push(new_conv_a[i])

            }
            else if(!new_conv_a[i].status){
              new_conv3.push(new_conv_a[i])
            }
          }
          for(let i=0;i<new_conv3.length;i++){
            new_conv2.push(new_conv3[i])
          }
          setConversations(new_conv2);
        }
      }
    }, [arrivalConversation,arrivalMessage, currentChat]);
    
   


    // chạy 1 lần cho đến khi user thay đổi 
    // cập nhật thông tin user đăng nhập và lấy danh sách user online 
    // reference user chỉ có tác dụng tạo kết nối; còn thằng socket sẽ liên tục lắng nghe và cập nhật ngay khi có thay đổi 
    useEffect(() => {
      socket.current.emit("addUser", user._id); // cập nhật idUser lên server socket 
      socket.current.on("getUsers", (users) => { // thằng web socket trả về những user đang kết nối với web socket server 
        setChatUsers(users); // set những User có thể tham gia chat 
      });
    }, [user]);
 
    // láy thông tin conversatio 
    useEffect(() => {
      const getConversations = async () => {
        try {
          const res = await axios.get("/conversations/" + user._id);
          // sắp xếp
          let new_conv_a=res.data;
          let new_conv2=[];
          let new_conv3=[];
          for(let i=0;i<new_conv_a.length;i++){
            if(new_conv_a[i].status){
              new_conv2.push(new_conv_a[i])
            }
            else if(!new_conv_a[i].status){
              new_conv3.push(new_conv_a[i])
            }
          }
          for(let i=0;i<new_conv3.length;i++){
            new_conv2.push(new_conv3[i])
          }
          
          setConversations(new_conv2);
           
         
        } catch (err) {
          console.log(err);
        }
      };
      getConversations();
    }, [user._id,arrivalMessage,currentChat]); // cập nhận danh sách conversation khi có tin nhắn mới 
    
    // currentChat = conversation được chọn => CurrentChat.id= conversaton._id 
    // Trong thằng messenger có lưu 1 trường là id conversation 
    useEffect(() => {  // lấy ra danh sách message khi current chat thay đổi
      const getMessages = async () => {
        try {
          const res = await axios.get("/messages/" + currentChat?._id);  // current chat có thể rỗng vì ban đầu có thể chưa chọn 
          setMessages(res.data);
        } catch (err) {
          console.log(err);
        }
      };
      getMessages();
    }, [currentChat,arrivalMessage]);// đừng để thành vòng lặp vô hạn 
    
    // chat
    const handleSubmit = async (e) => {
      e.preventDefault();
      // current 
      const message = {
        // thu thập dữ liệu 
        sender: user._id,
        text: newMessage,  // set liên tục ; vừa gõ vừa re-render FE 
        conversationId: currentChat._id,// thu thập dữ liệu 
      };
      // current chat lưu 1 mảng gômg id của user và id của người tham gia chat 
      const receiverId = currentChat.members.filter(
        (member) => member !== user._id 
      );
      
      // bắn đoạn tin lên web socket 
      // quan trọng là thằng socket này đã mang id
      try {
        // cập nhật dữ liệu trong db về conv nhận đc tin nhắn 
        const res_conv = await axios.post("/conversations/update", {id:currentChat._id,status:true});  // call api gửi tin nhắn vào db 
 
        const res = await axios.post("/messages", message);  // call api gửi tin nhắn vào db 
        // trả về message vừa nhập 
        // sau đó set bổ sung vào mảng  và emit tin nhắn nhận được 
        socket.current.emit("sendMessage", {
          senderId: user._id,
          receiverId: receiverId,// 1 mảng 
          text: newMessage,
          idConversation:currentChat._id,
          idmes:res.data._id
        });
        console.log(socket);
        setMessages([...messages, res.data]);  // set lại danh sách tin nhắn => re-render -FE 
        setNewMessage("");   // set lại tin nhắn 
      } catch (err) {
        console.log(err);
      }
    };
    

    // upload file 
    const { getRootProps, getInputProps } = useDropzone({
      // bỏ accepted đi là up file nào cũng được hết 

      // cho up từng file 1 trước 
      onDrop: (accceptedFiles)=>{
          
          console.log(accceptedFiles[0]); // lấy dữ liệu từ file tại đây và tiến hành socket và re-render ui 
          
          // upload file 
          let formData = new FormData;
          const config = {
              header: { 'content-type': 'multipart/form-data' }
          }
          formData.append("file", accceptedFiles[0])
          axios.post('/chat/uploadfiles', formData, config)
          .then(response => {
            if (response.data.success) {
              

              // emit tin nhắn lên ws

              const message = {
                // thu thập dữ liệu 
                sender: user._id,
                text:"images/"+ response.data.url,  // tên file 
                conversationId: currentChat._id,// thu thập dữ liệu 
              };
              // current chat lưu 1 mảng gômg id của user và id của người tham gia chat 
              const receiverId = currentChat.members.filter(
                member => member !== user._id
              );
              try {
                // cập nhật dữ liệu trong db về conv nhận đc tin nhắn 
                axios.post("/conversations/update", {id:currentChat._id,status:true})  // call api gửi tin nhắn vào db 
                .then(response1 => {})
                axios.post("/messages", message)  // call api gửi tin nhắn vào db 
                .then(response2 => {
                      // bắn đoạn tin lên web socket 
                  // quan trọng là thằng socket này đã mang id
                  console.log(response2)
                  socket.current.emit("sendMessage", {
                    idmes:response2.data._id,
                    senderId: user._id,
                    receiverId,
                    text:response2.data.text, // tên file 
                    idConversation:currentChat._id
                  });
                    // trả về message vừa nhập 
                  // sau đó set bổ sung vào mảng 
                  console.log(response2.data.text);
                  setMessages([...messages, response2.data]);  // set lại danh sách tin nhắn => re-render -FE 
                  setNewMessage("");   // set lại tin nhắn 
                }) 
              } catch (err) {
                console.log(err);
              }
            }
        })
      }
    }); 
   
    // khi xem conv
    const handleSeeCoversation = async (c)=>{
      setCurrentChat(c); // re-render 
      
      let index = conversations.findIndex((val) => val._id === c._id);
      let new_conv=conversations;
      new_conv[index].status= false;

      const sort_conv=sortCoversation()
      setConversations(sort_conv);
      const res = await axios.post("/conversations/update", {id:c._id,status:false});  // call api gửi tin nhắn vào db 
    }
   
    // tạo conversation
    const handleCreateCoversation = async (receiver)=>{
      var a=0;
      try {
         // console.log(conversations)
         for(var i=0;i<conversations.length;i++){
           if(conversations[i].members.includes(receiver)){
            a=a+1;
           }
         }
         if(a>0){
          alert("Đã có cov không call api")
         }
         else{
          const res = await axios.post("/conversations", {senderId:user._id,receiverId:receiver});  // call api gửi tin nhắn vào db 
          // trả về message vừa nhập 
          // sau đó set bổ sung vào mảng 
          // thông báo lên web soket 
          socket.current.emit("CreateConversation", {
            _id:res.data._id,
            senderId: user._id,  // gửi lên dữ liệu sender 
            receiver:receiver
          });
          setConversations([...conversations, res.data]);  // set lại danh sách tin nhắn => re-render -FE 
          }
      } catch (err) {
        console.log(err);
      }

    }

    
    useEffect(() => {
      scrollRef.current?.scrollIntoView({ behavior: "smooth" });// đoạn code để trượt xuống khi có tin nhắn mới 
    }, [messages]);
    
    console.log(conversations);
    console.log(messages)
    console.log(chatUsers)
    return (
        <div>
              <Topbar socketServer={socket}/>
      <div className="messenger">
        <div className="chatMenu">
          <div className="chatMenuWrapper">
            <input placeholder="Search for friends" className="chatMenuInput"onChange={e=>setSearchCon(e.target.value)}   />
              {/*click thì set thông tin currentchat theo thông tin của conversation*/}
              
                {conversations.map((c) => (
                  <div key={c._id} onClick={() =>handleSeeCoversation(c)}>
                    {/*nếu c là true thì cho là đỏ( chưa đọc còn nếu là false thì màu đen*/}
                    <Conversation socketServer={socket} conSetup={conversations} setConSetup={setConversations} conversation={c} currentUser={user} convSearch={searchCon} />
                  </div>
                ))}
              
          </div>
        </div>
        <div className="chatBox">
          <div className="chatBoxWrapper">
          {currentChat ? (
              <>
                <div className="chatBoxTop">
                  {messages.map((m) => (
                    <div ref={scrollRef}>
                      {/*chỉnh giá trị own dựa vào cách so sánh người gửi tin nhắn với id của người đăng nhập*/}
                      <Message key={m._id} listMes={messages} setListMes={setMessages} memberMes={currentChat.members} socketServer={socket} message={m} own={m.sender === user._id} />
                    </div>
                  ))}
                </div>
                <div className="chatBoxBottom">
                  <textarea
                    className="chatMessageInput"
                    placeholder="write something..."
                    onChange={(e) => setNewMessage(e.target.value)}
                    value={newMessage}
                  ></textarea>
                  <button className="chatSubmitButton" onClick={handleSubmit}>
                    Send
                  </button>
                </div>
                {/*upload file*/}
                <div {...getRootProps({ className: "dropzone" })}>
                  
                  <input className="input-zone" {...getInputProps()} />
                  <i style={{cursor:"pointer",fontSize:"25px",zIndex: 10,position:"fixed",bottom:10,marginLeft:"40%"}} className="fa-solid fa-upload"></i>
                </div>
              </>
            ) : (
              <span className="noConversationText">
                Open a conversation to start a chat.
              </span>
            )}
          </div>
        </div>
        <div className="chatOnline">
              <div className="chatOnlineWrapper">
                      {chatUsers.map((m) => (
                            <div onClick={() => handleCreateCoversation(m.userId)}>
                              {/*chỉnh giá trị own dựa vào cách so sánh người gửi tin nhắn với id của người đăng nhập*/}
                              {/*Bây giờ sẽ truyền vào mảng gồm userId và socketID*/}
                              <ChatOnline 
                                key={m.userId}
                                userInfor={m} 
                                currentUser={user}
                                />
                            </div>
                        ))}
                    </div>
        </div>
      </div>
        </div>
    )
}