import User from '../models/User.js'

//Create new User
export const createUser = async (req, res) => {
   const newUser = new User(req.body)

   try {
      const savedUser = await newUser.save()

      res.status(200).json({ success: true, message: 'Successfully created', data: savedUser })
   } catch (error) {
      console.error('createUser error:', error)
      res.status(500).json({ success: false, message: 'Failed to create. Try again!', error: error.message })
   }
}

//Update User
export const updateUser = async (req, res) => {
   const id = req.params.id

   try {
      const updatedUser = await User.findByIdAndUpdate(id, {
         $set: req.body
      }, { new: true })

      res.status(200).json({ success: true, message: 'Successfully updated', data: updatedUser })
   } catch (error) {
      console.error('updateUser error:', error)
      res.status(500).json({ success: false, message: 'Failed to update', error: error.message })
   }
}

//Delete User
export const deleteUser = async (req, res) => {
   const id = req.params.id

   try {
      await User.findByIdAndDelete(id)

      res.status(200).json({ success: true, message: 'Successfully deleted' })
   } catch (error) {
      console.error('deleteUser error:', error)
      res.status(500).json({ success: false, message: 'Failed to delete', error: error.message })
   }
}

//Get single User
export const getSingleUser = async (req, res) => {
   const id = req.params.id

   try {
      const user = await User.findById(id)

      res.status(200).json({ success: true, message: 'Successfully', data: user })
   } catch (error) {
      console.error('getSingleUser error:', error)
      res.status(404).json({ success: false, message: 'Not Found', error: error.message })
   }
}

//GetAll User
export const getAllUser = async (req, res) => {
   //console.log(page)

   try {
      const users = await User.find({})

      res.status(200).json({ success: true, message: 'Successfully', data: users })
   } catch (error) {
      console.error('getAllUser error:', error)
      res.status(404).json({ success: false, message: 'Not Found', error: error.message })
   }
}