import axios from "axios";
import { useEffect, useState } from "react";
import "./chatOnline.css"

// thằng này nó sẽ hiện ra danh sách bạn bè đang online của bạn và nếu bạn click vào 
// thì có thể trò chuyện với họ 

export default function User({userInfor,currentUser}) {
  const PF = "https://messenger-api-express.herokuapp.com/images/";
    //logic cần nằm trong thẻ dom 
    return (
      <div>
          {(userInfor._id==currentUser._id) ? (
              <div>
              </div>
          ) : (
            <div className="chatOnline">
        
                  <div className="chatOnlineFriend" >
                    <div className="chatOnlineImgContainer">
                    <img
                        className="conversationImg"
                        src={
                          userInfor?.profilePicture
                            ? PF + userInfor.profilePicture
                            : PF + "person/noAvatar.png"
                        }
                        alt=""
                      />
                      <div className="chatOnlineBadge"></div>
                    </div>
                    <span className="chatOnlineName">{userInfor.username}</span>
                  </div>
          </div>

          )}
      </div>
     


     
    );
  }