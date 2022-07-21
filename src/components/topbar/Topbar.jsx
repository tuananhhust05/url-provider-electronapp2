import "./topbar.css";
import { Search, Person, Chat, Notifications } from "@material-ui/icons";
import { Link } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useState } from "react";
import { useEffect } from "react";
import axios from "axios"
import User from "../user/user" 

export default function Topbar({ socketServer }) {
  
  

  // lấy thông tin đăng nhập từ con text 
  const { user } = useContext(AuthContext);
  const PF = "https://messenger-api-express.herokuapp.com/images/";
  const [openCreateGroup, setOpenCreateGroup] = useState(false)
  const [alluser, setAlluser] = useState([])
  const [chosenUser, setChosenUser] = useState([user._id]); // chosen user
  const handleCheck=(id) =>{
    setChosenUser( prev=>{
      const isChecked =chosenUser.includes(id)  // kiểm tra trong mảng đã có id này chưa
      if(isChecked){ // nếu có rôif thì thay thuộc tính cho nó 
        return chosenUser.filter(item=>item!==id) // lọc ra những thằng id khác với id truyền vào 
      }
      else{  // nếu trong tập hợp không có thì trả ra mảng cũ và id mới 
        return[...prev,id] 
      }
    })
 }
 
 const handleSubmit= async () =>{
  setOpenCreateGroup(false);
  
  let finalchosenUser=chosenUser;
  let result=finalchosenUser.filter(m=>m !==user._id)
  console.log(result);
  console.log(chosenUser)
  const res = await axios.post("/conversations/multiconv", {arraymember:chosenUser}); 
  socketServer.current.emit("CreateGroup", {
    _id:res.data._id,
    sender:user._id,
    receiver:result
   });
  
  
 }
  useEffect(() => {  // lấy ra danh sách message khi current chat thay đổi
    const getAlluser = async () => {
      try {
        const res = await axios.get("/users/alluser");  // current chat có thể rỗng vì ban đầu có thể chưa chọn 
        setAlluser(res.data);
      } catch (err) {
        console.log(err);
      }
    };
    getAlluser();
  },[]);
  

  return (
    <div className="topbarContainer">
      <div className="topbarLeft">
        <Link to="/" style={{ textDecoration: "none" }}>
          <span className="logo">Message</span>
        </Link>
      </div>
      {/*Phím tạo nhóm*/}
      <div onClick={() =>setOpenCreateGroup(true)} style={{cursor:"pointer"}} className="topbarLeft">
        <i style={{color:"white"}} className="fa-solid fa-plus"></i>
        <span style={{color:"white",margin:"5px"}}>Tạo nhóm</span>
      </div>
      {/*Form tạo nhóm*/}
      {
        openCreateGroup?
        ( <form>
            <div style={{position:"fixed",top:"20%",backgroundColor:"white",height:"400px", width:"400px",boxShadow:"2px 2px 2px black",borderRadius:"10px"}}>
                <i onClick={() =>setOpenCreateGroup(false)} style={{position:"absolute",right:"5px",top:"7px"}}className="fa-solid fa-xmark"></i>
                 
                {alluser.map(m =>(
                  <div style={{display:"flex"}} key={m._id}>
                     <User 
                                userInfor={m} 
                                currentUser={user}
                      />
                    {
                      (m._id !==user._id) ?(
                        <input style={{position:"absolute",right:"5px",fontSize:"50px",margin:"30px"}} type="checkbox"
                        checked={chosenUser.includes(m._id)}// kiểm tra thằng này có id có nămf trong chosen id không 
                        onChange={()=>handleCheck(m._id)}
                        />
                      ):(
                        <div></div>
                      )
                    }
                  </div>
                ))}
                <button onClick={() =>handleSubmit()} className="btn btn-primary" style={{position:"absolute",bottom:"5px",margin:"0 30%"}}>
                  Tạo nhóm
                </button>
            </div>
          </form>
        ):
        (
          <div></div>
        )
      }
        
      <div className="topbarCenter">
        <div className="searchbar">
          <Search className="searchIcon" />
          <input
            placeholder="Search for friend, post or video"
            className="searchInput"
          />
        </div>
      </div>
      <div className="topbarRight">
        <div className="topbarLinks">
          <span className="topbarLink">Homepage</span>
          <span className="topbarLink">Timeline</span>
        </div>
        <div className="topbarIcons">
          <div className="topbarIconItem">
            <Person />
            <span className="topbarIconBadge">1</span>
          </div>
          <div className="topbarIconItem">
            <Chat />
            <span className="topbarIconBadge">2</span>
          </div>
          <div className="topbarIconItem">
            <Notifications />
            <span className="topbarIconBadge">1</span>
          </div>
        </div>
        {/*Đường link truy cập lên DB để lấy thông tin điền vào profile*/}
        <Link to={`/profile/${user.username}`}>
          <img
            src={
              user.profilePicture
                ? PF + user.profilePicture
                : PF + "person/noAvatar.png"
            }
            alt=""
            className="topbarImg"
          />
        </Link>
      </div>
    </div>
  );
}
