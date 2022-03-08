<?php

namespace App\Http\Tools;

use App;
use App\Share;
use App\FileManagerFile;
use App\FileManagerFolder;
use App\Http\Requests\FileFunctions\RenameItemRequest;
use App\User;
use App\Zip;
use Aws\Exception\MultipartUploadException;
use Aws\S3\MultipartUploader;
use Carbon\Carbon;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\ImageManagerStatic as Image;
use League\Flysystem\FileNotFoundException;
use Madnest\Madzipper\Facades\Madzipper;
use SebastianBergmann\Environment\Console;
use Symfony\Component\HttpKernel\Exception\HttpException;


class Editor
{
    /**
     * Store folder icon
     *
     * @param $folder_icon
     * @param $unique_id
     * @param $shared
     */
    public static function set_folder_icon($folder_icon, $unique_id, $shared = null)
    {
        $user_id = is_null($shared) ? Auth::id() : $shared->user_id;

        // Get folder
        $folder = FileManagerFolder::where('user_id', $user_id)
            ->where('unique_id', $unique_id)
            ->first();

        // Set default folder icon
        if ($folder_icon === 'default') {
            $folder->icon_emoji = null;
            $folder->icon_color = null;
        }

        // If request have emoji set folder icon emoji
        if (isset($folder_icon['emoji'])) {
            $folder->icon_emoji = $folder_icon['emoji'];
            $folder->icon_color = null;
        }

        // If request have color set folder icon color
        if (isset($folder_icon['color'])) {
            $folder->icon_emoji = null;
            $folder->icon_color = $folder_icon['color'];
        }

        // Save changes
        $folder->save();

    }

    /**
     * Zip requested folder
     *
     * @param $unique_id
     * @param $shared
     * @return mixed
     * @throws \Illuminate\Contracts\Filesystem\FileNotFoundException
     */
    public static function zip_folder($unique_id, $shared = null)
    {
        // Get folder
        $requested_folder = FileManagerFolder::with(['folders.files', 'files'])
            ->where('unique_id', $unique_id)
            ->where('user_id', Auth::id() ?? $shared->user_id)
            ->with('folders')
            ->first();

        $files = get_files_for_zip($requested_folder, collect([]));

        // Local storage instance
        $disk_local = Storage::disk('local');

        // Create zip directory
        if (!$disk_local->exists('zip')) {
            $disk_local->makeDirectory('zip');
        }

        // Move file to local storage
        if (!is_storage_driver('local')) {

            // Create temp directory
            if (!$disk_local->exists('temp')) {
                $disk_local->makeDirectory('temp');
            }

            foreach ($files as $file) {
                try {
                    $disk_local->put('temp/' . $file['basename'], Storage::get('file-manager/' . $file['basename']));
                } catch (FileNotFoundException $e) {
                    throw new HttpException(404, 'File not found');
                }
            }
        }

        // Get zip path
        $zip_name = Str::random(16) . '-' . Str::slug($requested_folder->name) . '.zip';
        $zip_path = 'zip/' . $zip_name;

        // Create zip
        $zip = Madzipper::make(storage_path() . '/app/' . $zip_path);

        // Get files folder on local storage drive
        $files_folder = is_storage_driver('local') ? 'file-manager' : 'temp';

        // Add files to zip
        foreach ($files as $file) {
            $zip->folder($file['folder_path'])->addString($file['name'], File::get(storage_path() . '/app/' . $files_folder . '/' . $file['basename']));
        }

        // Close zip
        $zip->close();

        // Delete temporary files
        if (!is_storage_driver('local')) {

            foreach ($files as $file) {
                $disk_local->delete('temp/' . $file['basename']);
            }
        }

        // Store zip record
        return Zip::create([
            'user_id'      => $shared->user_id ?? Auth::id(),
            'shared_token' => $shared->token ?? null,
            'basename'     => $zip_name,
        ]);
    }

    /**
     * Zip selected files, store it in /zip folder and retrieve zip record
     *
     * @param $files
     * @param null $shared
     * @return mixed
     * @throws \Illuminate\Contracts\Filesystem\FileNotFoundException
     */
    public static function zip_files($files, $shared = null)
    {
        // Local storage instance
        $disk_local = Storage::disk('local');

        // Create zip directory
        if (!$disk_local->exists('zip')) {
            $disk_local->makeDirectory('zip');
        }

        // Move file to local storage from external storage service
        if (!is_storage_driver('local')) {

            // Create temp directory
            if (!$disk_local->exists('temp')) {
                $disk_local->makeDirectory('temp');
            }

            foreach ($files as $file) {
                try {
                    $disk_local->put('temp/' . $file['basename'], Storage::get('file-manager/' . $file['basename']));
                } catch (FileNotFoundException $e) {
                    throw new HttpException(404, 'File not found');
                }
            }
        }

        // Get zip path
        $zip_name = Str::random(16) . '.zip';
        $zip_path = 'zip/' . $zip_name;

        // Create zip
        $zip = Madzipper::make(storage_path() . '/app/' . $zip_path);

        // Get files folder on local storage drive
        $files_directory = is_storage_driver('local') ? 'file-manager' : 'temp';

        // Add files to zip
        $files->each(function ($file) use ($zip, $files_directory) {
            $zip->addString($file['name'] . '.' . $file['mimetype'], File::get(storage_path() . '/app/' . $files_directory . '/' . $file['basename']));
        });

        // Close zip
        $zip->close();

        // Delete temporary files
        if (!is_storage_driver('local')) {

            $files->each(function ($file) use ($disk_local) {
                $disk_local->delete('temp/' . $file['basename']);
            });
        }

        // Store zip record
        return Zip::create([
            'user_id'      => $shared->user_id ?? Auth::id(),
            'shared_token' => $shared->token ?? null,
            'basename'     => $zip_name,
        ]);
    }

    /**
     * Create new directory
     *
     * @param $request
     * @param null $shared
     * @return FileManagerFolder|\Illuminate\Database\Eloquent\Model
     */
    public static function create_folder($request, $shared = null)
    {
        // Get variables
        $user_scope = is_null($shared) ? $request->user()->token()->scopes[0] : 'editor';
        $name = $request->has('name') ? $request->input('name') : 'New Folder';
        $user_id = is_null($shared) ? Auth::id() : $shared->user_id;
        $unique_id = get_unique_id();

        // Create folder
        $folder = FileManagerFolder::create([
            'parent_id'  => $request->parent_id,
            'unique_id'  => $unique_id,
            'user_scope' => $user_scope,
            'user_id'    => $user_id,
            'type'       => 'folder',
            'name'       => $name,
        ]);

        // Return new folder
        return $folder;
    }

    /**
     * Rename item name
     *
     * @param RenameItemRequest $request
     * @param $unique_id
     * @param null $shared
     * @return \Illuminate\Database\Eloquent\Builder|\Illuminate\Database\Eloquent\Model
     * @throws \Exception
     */
    public static function rename_item($request, $unique_id, $shared = null)
    {
        // Get user id
        $user_id = is_null($shared) ? Auth::id() : $shared->user_id;

        // Get item
        $item = get_item($request->type, $unique_id, $user_id);

        // Rename item
        $item->update([
            'name' => $request->name
        ]);

        // Return updated item
        return $item;
    }

    /**
     * Delete file or folder
     *
     * @param $request
     * @param $unique_id
     * @param null $shared
     * @throws \Exception
     */
    public static function delete_item($file, $unique_id, $shared = null)
    {
        // Get user id
        $user = is_null($shared) ? Auth::user() : User::findOrFail($shared->user_id);

        // Delete folder
        if ($file['type'] === 'folder') {

            // Get folder
            $folder = FileManagerFolder::withTrashed()
                ->with(['folders'])
                ->where('user_id', $user->id)
                ->where('unique_id', $unique_id)
                ->first();

            // Get folder shared record
            $shared = Share::where('user_id', $user->id)
                ->where('type', '=', 'folder')
                ->where('item_id', $unique_id)
                ->first();

            // Delete folder shared record
            if ($shared) {
                $shared->delete();
            }

            // Force delete children files
            if ($file['force_delete']) {

                // Get children folder ids
                $child_folders = filter_folders_ids($folder->trashed_folders, 'unique_id');

                // Get children files
                $files = FileManagerFile::onlyTrashed()
                    ->where('user_id', $user->id)
                    ->whereIn('folder_id', Arr::flatten([$unique_id, $child_folders]))
                    ->get();

                // Remove all children files
                foreach ($files as $file) {

                    // Delete file
                    Storage::delete('/file-manager/' . $file->basename);

                    // Delete thumbnail if exist
                    if (!is_null($file->thumbnail)) Storage::delete('/file-manager/' . $file->getRawOriginal('thumbnail'));

                    // Delete file permanently
                    $file->forceDelete();
                }

                // Delete folder record
                $folder->forceDelete();
            }

            // Soft delete items
            if (!$file['force_delete']) {

                // Remove folder from user favourites
                $user->favourite_folders()->detach($unique_id);

                // Soft delete folder record
                $folder->delete();
            }
        }

        // Delete item
        if ($file['type'] !== 'folder') {

            // Get file
            $item = FileManagerFile::withTrashed()
                ->where('user_id', $user->id)
                ->where('unique_id', $unique_id)
                ->first();

            // Get folder shared record
            $shared = Share::where('user_id', $user->id)
                ->where('type', '=', 'file')
                ->where('item_id', $unique_id)
                ->first();

            // Delete file shared record
            if ($shared) {
                $shared->delete();
            }

            // Force delete file
            if ($file['force_delete']) {

                // Delete file
                Storage::delete('/file-manager/' . $item->basename);

                // Delete thumbnail if exist
                if ($item->thumbnail) Storage::delete('/file-manager/' . $item->getRawOriginal('thumbnail'));

                // Delete file permanently
                $item->forceDelete();
            }

            // Soft delete file
            if (!$file['force_delete']) {

                // Soft delete file
                $item->delete();
            }
        }
    }

    public static function mytest($request, $to_unique_id)
    {
        $user_id = Auth::id();
        $to_unique_id = 2;
        $fr_unique_id = 1;
        $reference_id = 1;
        $diff_folder_id = 1;
        // get all sub-folders of current folder
        $query = DB::table('file_manager_folders')
            ->where('unique_id', strval($fr_unique_id))
            ->unionAll(
                DB::table('file_manager_folders')
                    ->select('file_manager_folders.*')
                    ->join('tree', 'tree.unique_id', '=', 'file_manager_folders.parent_id')
        );
        $sub_folders_query = DB::table('tree')
            ->withRecursiveExpression('tree', $query)
            ->orderBy('unique_id', "asc");
        $sub_folders = $sub_folders_query->get();

        $folder_ids = [];
        if (count($sub_folders) > 0)
        {
            $last_folder_unique_id = get_unique_id();
            $fist_folder_unique_id = $sub_folders->get(0)->unique_id;
            $diff_folder_id = ($last_folder_unique_id - $fist_folder_unique_id);
            foreach($sub_folders as $folder){
                array_push($folder_ids, $folder->unique_id);
                $parent_id = $to_unique_id;
                if ($folder->unique_id != $fr_unique_id){
                    $parent_id = $folder->parent_id + $diff_folder_id;
                }
                else {
                    $reference_id = $folder->unique_id;
                }
                $unique_id = $folder->unique_id + $diff_folder_id;
                $user_scope =  Auth::user()->token()->scopes[0];
                FileManagerFolder::create([
                    'parent_id'  => $parent_id,
                    'unique_id'  => $unique_id,
                    'user_scope' => $user_scope,
                    'user_id'    => $user_id,
                    'type'       => 'folder',
                    'name'       => $folder->name,
                ]);
            }
        }

        $files = DB::table('file_manager_files')->whereIn('folder_id', $folder_ids)->get();
        if (count($files) > 0)
        {
            $disk_local = Storage::disk('local');
            $last_file_unique_id = get_unique_id();
            $fist_file_unique_id = $files->get(0)->unique_id;
            $diff_file_id = ($last_file_unique_id - $fist_file_unique_id);
            foreach($files as $file) {
                $folder_id = $reference_id;
                if ($file->folder_id != $fr_unique_id){
                    $folder_id = $file->folder_id + $diff_folder_id;
                }
                $unique_id = $file->unique_id + $diff_file_id;
                $user_scope =  Auth::user()->token()->scopes[0];
                $filename = config('filesystems.disks.local.root') . '/file-manager/' . $file->basename;
                $disk_file_name = substr(md5(mt_rand()), 0, 17) . '-' . $file->name;
                $thumbnail = null;
                if ($file->thumbnail) {
                    $thumbnail = 'thumbnail-' . $disk_file_name;
                    $disk_local->copy('file-manager/' . $file->thumbnail, 'file-manager/' . $thumbnail);
                }
                $disk_local->copy('file-manager/' . $file->basename, 'file-manager/' . $disk_file_name);
                
                $options = [
                    'mimetype'   => $file->mimetype,
                    'type'       => $file->type,
                    'folder_id'  => $folder_id,
                    'metadata'   => $file->metadata,
                    'name'       => $file->name,
                    'unique_id'  => $unique_id,
                    'basename'   => $disk_file_name,
                    'user_scope' => $user_scope,
                    'thumbnail'  => $thumbnail,
                    'filesize'   => $file->filesize,
                    'user_id'    => $user_id,
                ];  
                FileManagerFile::create($options);                
            }
        }
    }
    
    /**
     * Move folder or file to new location
     *
     * @param $request
     * @param $unique_id
     * @param null $shared
     */

    
    public static function copy($request, $to_unique_id)
    {
        $createdItems = [];

        // Get user id
        $user_id = Auth::id();

        foreach ($request->input('items') as $item) {
            $fr_unique_id = $item['unique_id'];

            if ($item['type'] === 'folder') {

                $reference_id = null;       // for file save 
                $diff_folder_id = null;

                // get all sub-folders of current folder
                $query = DB::table('file_manager_folders')
                    ->where('unique_id', strval($fr_unique_id))
                    ->unionAll(
                        DB::table('file_manager_folders')
                            ->select('file_manager_folders.*')
                            ->join('tree', 'tree.unique_id', '=', 'file_manager_folders.parent_id')
                );
                $sub_folders_query = DB::table('tree')
                    ->withRecursiveExpression('tree', $query)
                    ->where('deleted_at', null)
                    ->orderBy('unique_id', "asc");
                $sub_folders = $sub_folders_query->get();
        
                // save unique_id of all sub-folders
                $folder_ids = [];

                if (count($sub_folders) > 0)
                {
                    // get diff-value of between first and last element
                    $last_folder_unique_id = get_unique_id();
                    $fist_folder_unique_id = $sub_folders->get(0)->unique_id;
                    $diff_folder_id = ($last_folder_unique_id - $fist_folder_unique_id);

                    // process all sub-folders
                    foreach($sub_folders as $folder){
                        array_push($folder_ids, $folder->unique_id);
                        $parent_id = $to_unique_id;

                        if ($folder->unique_id != $fr_unique_id){
                            $parent_id = $folder->parent_id + $diff_folder_id;
                        }
                        else {
                            $reference_id = $folder->unique_id + $diff_folder_id;
                        }

                        if(!$reference_id) abort(413);
                        if(!$diff_folder_id || $diff_folder_id < 1) abort(413);

                        $unique_id = $folder->unique_id + $diff_folder_id;
                        $user_scope =  Auth::user()->token()->scopes[0];
                        $newfolder = FileManagerFolder::create([
                            'parent_id'  => $parent_id,
                            'unique_id'  => $unique_id,
                            'user_scope' => $user_scope,
                            'user_id'    => $user_id,
                            'type'       => 'folder',
                            'name'       => $folder->name,
                        ]);
                        if ($folder->unique_id === $fr_unique_id)
                            array_push($createdItems, $newfolder);
                    }
                }
        
                // get all file info of copied subfolders.
                $files = DB::table('file_manager_files')
                    ->whereIn('folder_id', $folder_ids)
                    ->where('deleted_at', null)
                    ->get();
                if (count($files) > 0)
                {
                    $disk_local = Storage::disk('local');

                    // get differ-val of unique_id between last and begin
                    $last_file_unique_id = get_unique_id();
                    $fist_file_unique_id = $files->get(0)->unique_id;
                    $diff_file_id = ($last_file_unique_id - $fist_file_unique_id);

                    // process for all files
                    foreach($files as $file) {
                        $folder_id = $reference_id;
                        if ($file->folder_id != $fr_unique_id){
                            // for file of root-folder
                            $folder_id = $file->folder_id + $diff_folder_id;
                        }

                        $unique_id = $file->unique_id + $diff_file_id;
                        $user_scope =  Auth::user()->token()->scopes[0];
                        // $filename = config('filesystems.disks.local.root') . '/file-manager/' . $file->basename;
                        $disk_file_name = substr(md5(mt_rand()), 0, 17) . '-' . $file->name;
                        $thumbnail = null;
                        if ($file->thumbnail) {
                            // if file is image..
                            $thumbnail = 'thumbnail-' . $disk_file_name;

                            // copy thumbnail-file in storage...
                            $disk_local->copy('file-manager/' . $file->thumbnail, 'file-manager/' . $thumbnail);
                        }

                        // copy file in storage...
                        $disk_local->copy('file-manager/' . $file->basename, 'file-manager/' . $disk_file_name);
                        
                        $options = [
                            'mimetype'   => $file->mimetype,
                            'type'       => $file->type,
                            'folder_id'  => $folder_id,
                            'metadata'   => $file->metadata,
                            'name'       => $file->name,
                            'unique_id'  => $unique_id,
                            'basename'   => $disk_file_name,
                            'user_scope' => $user_scope,
                            'thumbnail'  => $thumbnail,
                            'filesize'   => $file->filesize,
                            'user_id'    => $user_id,
                            'width'      => $file->width,
                            'height'     => $file->height
                        ];  
                        $newfile = FileManagerFile::create($options);                
                        // array_push($createdItems, $newfile);
                    }
                }
                
            } else {
                $disk = Storage::disk(config('filesystems.default'));
                // get file info from file-db
                $file = FileManagerFile::where('unique_id', $fr_unique_id)->firstOrFail();

                $folder_id = $to_unique_id;
                $unique_id = get_unique_id();

                $user_scope =  Auth::user()->token()->scopes[0];
                // $filename = config('filesystems.disks.local.root') . '/file-manager/' . $file->basename;
                $disk_file_name = substr(md5(mt_rand()), 0, 17) . '-' . $file->name;
                $thumbnail = null;
                if ($file->mythumbnail()) {
                    // if file is image..
                    $thumbnail = 'thumbnail-' . $disk_file_name;

                    // copy thumbnail-file in storage...
                    $disk->copy('file-manager/' . $file->mythumbnail(), 'file-manager/' . $thumbnail);
                }

                // copy file in storage...
                $disk->copy('file-manager/' . $file->basename, 'file-manager/' . $disk_file_name);
                
                $options = [
                    'mimetype'   => $file->mimetype,
                    'type'       => $file->type,
                    'folder_id'  => $folder_id,
                    'metadata'   => $file->metadata,
                    'name'       => $file->name,
                    'unique_id'  => $unique_id,
                    'basename'   => $disk_file_name,
                    'user_scope' => $user_scope,
                    'thumbnail'  => $thumbnail,
                    'filesize'   => $file->myfilesize(),
                    'user_id'    => $user_id,
                    'width'      => $file->width,
                    'height'     => $file->height                    
                ];  
                $newfile = FileManagerFile::create($options);   
                array_push($createdItems, $newfile);
            }

        }
        return $createdItems;
    }

    /**
     * Move folder or file to new location
     *
     * @param $request
     * @param $unique_id
     * @param null $shared
     */
    public static function move($request, $to_unique_id, $shared = null)
    {
        $movedItems = [];
        // Get user id
        $user_id = is_null($shared) ? Auth::id() : $shared->user_id;

        foreach ($request->input('items') as $item) {
            $unique_id = $item['unique_id'];

            if ($item['type'] === 'folder') {

                // Move folder
                $item = FileManagerFolder::where('user_id', $user_id)
                    ->where('unique_id', $unique_id)
                    ->firstOrFail();

                $item->update([
                    'parent_id' => $to_unique_id
                ]);
                array_push($movedItems, $item);
            } else {

                // Move file under new folder
                $item = FileManagerFile::where('user_id', $user_id)
                    ->where('unique_id', $unique_id)
                    ->firstOrFail();

                $item->update([
                    'folder_id' => $to_unique_id
                ]);
                array_push($movedItems, $item);
            }
        }
        return $movedItems;
    }

    /**
     * Upload file
     *
     * @param $request
     * @param null $shared
     * @return FileManagerFile|\Illuminate\Database\Eloquent\Model
     * @throws \Exception
     */
    public static function upload($request, $shared = null)
    {
        // Get parent_id from request
        $file = $request->file('file');

        // Check or create directories
        self::check_directories(['chunks', 'file-manager']);

        // File name
        $user_file_name = basename('chunks/' . substr($file->getClientOriginalName(), 17), '.part');
        $disk_file_name = basename('chunks/' . $file->getClientOriginalName(), '.part');
        $temp_filename = $file->getClientOriginalName();

        // File Path
        $file_path = config('filesystems.disks.local.root') . '/chunks/' . $temp_filename;

        // Generate file
        File::append($file_path, $file->get());
        
        // Size of file
        $file_size = File::size($file_path);

        // Size of limit
        $limit = get_setting('upload_limit');

        // File size handling
        if ($limit && $file_size > format_bytes($limit)) abort(413);

        // If last then process file
        if ($request->boolean('is_last')) {

            $metadata = get_image_meta_data($file);

            $disk_local = Storage::disk('local');
            $unique_id = get_unique_id();

            // Get user data
            $user_scope = is_null($shared) ? $request->user()->token()->scopes[0] : 'editor';
            $user_id = is_null($shared) ? Auth::id() : $shared->user_id;

            // File Info
            $file_size = $disk_local->size('chunks/' . $temp_filename);
            $file_mimetype = $disk_local->mimeType('chunks/' . $temp_filename);

            // Check if user has enough space to upload file
            self::check_user_storage_capacity($user_id, $file_size, $temp_filename);

            // Get the dimension of image 
            $local_disk = Storage::disk('local');
            $width = null;
            $height = null;
            if (in_array($local_disk->mimeType('chunks/' . $temp_filename), ['image/gif', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'])) {
                $image = Image::make(config('filesystems.disks.local.root') . '/' . 'chunks/' . $temp_filename)->orientate();
                $width = $image->width();
                $height = $image->height();
            }
           

            // Create thumbnail
            $thumbnail = self::get_image_thumbnail('chunks/' . $temp_filename, $disk_file_name);

            // Move finished file from chunk to file-manager directory
            $disk_local->move('chunks/' . $temp_filename, 'file-manager/' . $disk_file_name);

            // Move files to external storage
            if (!is_storage_driver(['local'])) {

                // Clear failed uploads if exists
                self::clear_failed_files();

                // Move file to external storage service
                self::move_to_external_storage($disk_file_name, $thumbnail);
            }

            // Store file
            $options = [
                'mimetype'   => get_file_type_from_mimetype($file_mimetype),
                'type'       => get_file_type($file_mimetype),
                'folder_id'  => $request->parent_id,
                'metadata'   => $metadata,
                'name'       => $request->filename,
                'unique_id'  => $unique_id,
                'basename'   => $disk_file_name,
                'user_scope' => $user_scope,
                'thumbnail'  => $thumbnail,
                'filesize'   => $file_size,
                'user_id'    => $user_id,
                'width'      => $width,
                'height'     => $height
            ];

            // Store user upload size
            if ($request->user()) {

                // If upload a loged user
                $request->user()->record_upload($file_size);

            } else {

                // If upload guest
                User::find($shared->user_id)->record_upload($file_size);

            }

            // Return new file
            return FileManagerFile::create($options);
        }
    }

    /**
     * Clear failed files
     */
    private static function clear_failed_files()
    {
        $local_disk = Storage::disk('local');

        // Get all files from storage
        $files = collect([
            $local_disk->allFiles('file-manager'),
            $local_disk->allFiles('chunks')
        ])->collapse();

        $files->each(function ($file) use ($local_disk) {

            // Get the file's last modification time.
            $last_modified = $local_disk->lastModified($file);

            // Get diffInHours
            $diff = Carbon::parse($last_modified)->diffInHours(Carbon::now());

            // Delete if file is in local storage more than 24 hours
            if ($diff > 24) {

                Log::info('Failed file or chunk ' . $file . ' deleted.');

                // Delete file from local storage
                $local_disk->delete($file);
            }
        });
    }

    /**
     * Move file to external storage if is set
     *
     * @param string $filename
     * @param string|null $thumbnail
     */
    private static function move_to_external_storage(string $filename, ?string $thumbnail): void
    {
        $disk_local = Storage::disk('local');

        foreach ([$filename, $thumbnail] as $file) {

            // Check if file exist
            if (!$file) continue;

            // Get file size
            $filesize = $disk_local->size('file-manager/' . $file);

            // If file is bigger than 5.2MB then run multipart upload
            if ($filesize > 5242880) {

                // Get driver
                $driver = \Storage::getDriver();

                // Get adapter
                $adapter = $driver->getAdapter();

                // Get client
                $client = $adapter->getClient();

                // Prepare the upload parameters.
                $uploader = new MultipartUploader($client, config('filesystems.disks.local.root') . '/file-manager/' . $file, [
                    'bucket' => $adapter->getBucket(),
                    'key'    => 'file-manager/' . $file
                ]);

                try {

                    // Upload content
                    $uploader->upload();

                } catch (MultipartUploadException $e) {

                    // Write error log
                    Log::error($e->getMessage());

                    // Delete file after error
                    $disk_local->delete('file-manager/' . $file);

                    throw new HttpException(409, $e->getMessage());
                }

            } else {

                // Stream file object to s3
                Storage::putFileAs('file-manager', config('filesystems.disks.local.root') . '/file-manager/' . $file, $file, 'private');
            }

            // Delete file after upload
            $disk_local->delete('file-manager/' . $file);
        }
    }

    /**
     * Check if directories 'chunks' and 'file-manager exist', if no, then create
     *
     * @param $directories
     */
    private static function check_directories($directories): void
    {
        foreach ($directories as $directory) {

            if (!Storage::disk('local')->exists($directory)) {
                Storage::disk('local')->makeDirectory($directory);
            }

            if (!is_storage_driver(['local'])) {
                $disk = Storage::disk('s3');
                if (!Storage::disk('s3')->exists($directory)) {
                    Storage::disk('s3')->makeDirectory($directory);
                }
            }
        }
    }

    /**
     * Create thumbnail for images
     *
     * @param string $file_path
     * @param string $filename
     * @param $file
     * @return string|null
     */
    private static function get_image_thumbnail(string $file_path, string $filename)
    {
        $local_disk = Storage::disk('local');

        // Create thumbnail from image
        if (in_array($local_disk->mimeType($file_path), ['image/gif', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'])) {

            // Get thumbnail name
            $thumbnail = 'thumbnail-' . $filename;

            // Create intervention image
            $image = Image::make(config('filesystems.disks.local.root') . '/' . $file_path)->orientate();

            // Resize image
            $image->resize(512, null, function ($constraint) {
                $constraint->aspectRatio();
            })->stream();

            // Store thumbnail to disk
            $local_disk->put('file-manager/' . $thumbnail, $image);
        }

        // Return thumbnail as svg file
        if ($local_disk->mimeType($file_path) === 'image/svg+xml') {

            $thumbnail = $filename;
        }

        return $thumbnail ?? null;
    }

    /**
     * Check if user has enough space to upload file
     *
     * @param $user_id
     * @param int $file_size
     * @param $temp_filename
     */
    private static function check_user_storage_capacity($user_id, int $file_size, $temp_filename): void
    {
        // Get user storage percentage and get storage_limitation setting
        $user_storage_used = user_storage_percentage($user_id, $file_size);
        $storage_limitation = get_setting('storage_limitation');

        // Check if user can upload
        if ($storage_limitation && $user_storage_used >= 100) {

            // Delete file
            Storage::disk('local')->delete('chunks/' . $temp_filename);

            // Abort uploading
            abort(423, 'You exceed your storage limit!');
        }
    }
}