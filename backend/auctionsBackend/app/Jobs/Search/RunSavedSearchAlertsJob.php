<?php

namespace App\Jobs\Search;

use App\Contracts\Search\ISearchService;
use App\DTOs\Search\SearchQueryDTO;
use App\Models\SavedSearch;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class RunSavedSearchAlertsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(ISearchService $searchService): void
    {
        SavedSearch::with('user')->chunk(100, function ($searches) use ($searchService) {
            foreach ($searches as $search) {
                try {
                    $filters = $search->filters ?? [];
                    
                    // Inject the 'since' filter to only get new listings since last run
                    $filters['since'] = $search->last_run_at ? $search->last_run_at->toDateTimeString() : null;
                    
                    // Reconstruct a faux request array to build DTO
                    $requestArr = $filters;
                    $request = new \Illuminate\Http\Request($requestArr);
                    $dto = SearchQueryDTO::fromRequest($request);
                    $dto->since = $filters['since'];

                    $results = $searchService->search($dto, true);
                    $total = $results['total'] ?? 0;

                    if ($total > 0) {
                        // Dispatch notification
                        // $notificationService->dispatch(new NewListingsFoundNotification(...));
                        Log::info("Saved search {$search->id} found {$total} new listings for user {$search->user_id}");
                    }

                    $search->update([
                        'last_run_at' => now(),
                        'last_result_count' => $total,
                    ]);

                } catch (\Exception $e) {
                    Log::error("Failed to run saved search {$search->id}: " . $e->getMessage());
                }
            }
        });
    }
}
