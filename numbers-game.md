
* ## Begin game

  user> .numbers
  > Create new game, start round timer

* ## Start round

  bot> New numbers round!
       Current target: 404
       Numbers: 1 3 4 7 50 95

* ## Submit guess

  user> .numbers 1 + 3 + 4 + 7 + 50 + 95
  > Reset round timer, store player's answer

  bot> @user missed the target by 244. Time extended.


* ## Submit guess
  user2> .numbers 95\*4+1\*50-7\*3
  > Reset round timer, store player's answer

  bot> @user2 missed the target by 5. Time extended.


* ## End round
  > Round timer triggered:

  bot> @user2 wins the round!
